"""
Chunk textbook markdown files into smaller pieces for embedding.

This script reads all markdown files from the docs/ directory,
chunks them into manageable pieces (500-1000 tokens with 100-token overlap),
and saves the chunks as JSON for the embedding script.
"""

import os
import json
import re
from pathlib import Path
from typing import List, Dict


def count_tokens(text: str) -> int:
    """
    Approximate token count (roughly 4 characters per token for English).

    Args:
        text: Input text

    Returns:
        Approximate token count
    """
    return len(text) // 4


def clean_markdown(text: str) -> str:
    """
    Clean markdown text by removing excessive whitespace while preserving structure.

    Args:
        text: Raw markdown text

    Returns:
        Cleaned text
    """
    # Remove frontmatter
    text = re.sub(r'^---\n.*?\n---\n', '', text, flags=re.DOTALL)

    # Replace multiple newlines with double newline
    text = re.sub(r'\n{3,}', '\n\n', text)

    # Strip leading/trailing whitespace
    text = text.strip()

    return text


def chunk_text(text: str, max_tokens: int = 800, overlap_tokens: int = 100) -> List[str]:
    """
    Chunk text into smaller pieces with overlap.

    Args:
        text: Input text to chunk
        max_tokens: Maximum tokens per chunk (default: 800)
        overlap_tokens: Number of overlapping tokens (default: 100)

    Returns:
        List of text chunks
    """
    # Split by paragraphs first
    paragraphs = text.split('\n\n')

    chunks = []
    current_chunk = []
    current_tokens = 0

    for para in paragraphs:
        para_tokens = count_tokens(para)

        # If single paragraph exceeds max_tokens, split it further
        if para_tokens > max_tokens:
            # Split by sentences
            sentences = re.split(r'(?<=[.!?])\s+', para)
            for sentence in sentences:
                sentence_tokens = count_tokens(sentence)

                if current_tokens + sentence_tokens > max_tokens:
                    if current_chunk:
                        chunks.append('\n\n'.join(current_chunk))

                        # Keep overlap
                        overlap_text = '\n\n'.join(current_chunk)
                        while count_tokens(overlap_text) > overlap_tokens:
                            current_chunk.pop(0)
                            if not current_chunk:
                                break
                            overlap_text = '\n\n'.join(current_chunk)

                    current_chunk = [sentence]
                    current_tokens = sentence_tokens
                else:
                    current_chunk.append(sentence)
                    current_tokens += sentence_tokens
        else:
            # Check if adding this paragraph exceeds limit
            if current_tokens + para_tokens > max_tokens:
                if current_chunk:
                    chunks.append('\n\n'.join(current_chunk))

                    # Keep overlap
                    overlap_text = '\n\n'.join(current_chunk)
                    while count_tokens(overlap_text) > overlap_tokens:
                        current_chunk.pop(0)
                        if not current_chunk:
                            break
                        overlap_text = '\n\n'.join(current_chunk)

                current_chunk = [para]
                current_tokens = para_tokens
            else:
                current_chunk.append(para)
                current_tokens += para_tokens

    # Add final chunk
    if current_chunk:
        chunks.append('\n\n'.join(current_chunk))

    return chunks


def process_markdown_file(file_path: Path, part: str, chapter_id: str) -> List[Dict]:
    """
    Process a single markdown file and return chunks with metadata.

    Args:
        file_path: Path to markdown file
        part: Part number (e.g., "part1")
        chapter_id: Chapter identifier

    Returns:
        List of chunk dictionaries with metadata
    """
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Extract title from markdown (first # heading)
    title_match = re.search(r'^#\s+(.+)$', content, re.MULTILINE)
    chapter_title = title_match.group(1) if title_match else chapter_id

    # Clean markdown
    cleaned_content = clean_markdown(content)

    # Chunk the content
    chunk_texts = chunk_text(cleaned_content)

    # Create chunk objects with metadata
    chunk_objects = []
    for idx, chunk_text_content in enumerate(chunk_texts):
        chunk_obj = {
            'chapter_id': chapter_id,
            'chapter_title': chapter_title,
            'part': part,
            'chunk_index': idx,
            'chunk_text': chunk_text_content,
            'chunk_token_count': count_tokens(chunk_text_content),
            'file_path': str(file_path)
        }
        chunk_objects.append(chunk_obj)

    return chunk_objects


def main():
    """Main function to process all textbook markdown files."""
    # Get project root directory
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    docs_dir = project_root / 'docs'

    if not docs_dir.exists():
        print(f"Error: docs directory not found at {docs_dir}")
        return

    all_chunks = []

    # Process all parts
    for part_dir in sorted(docs_dir.glob('part*')):
        if not part_dir.is_dir():
            continue

        part_name = part_dir.name
        print(f"\nProcessing {part_name}...")

        # Process all markdown files in this part
        for md_file in sorted(part_dir.glob('*.md')):
            chapter_id = f"{part_name}/{md_file.stem}"
            print(f"  - {chapter_id}")

            chunks = process_markdown_file(md_file, part_name, chapter_id)
            all_chunks.extend(chunks)
            print(f"    Generated {len(chunks)} chunks")

    # Also process intro.md if it exists
    intro_file = docs_dir / 'intro.md'
    if intro_file.exists():
        print(f"\nProcessing intro.md...")
        chunks = process_markdown_file(intro_file, 'intro', 'intro')
        all_chunks.extend(chunks)
        print(f"  Generated {len(chunks)} chunks")

    # Save chunks to JSON
    output_file = project_root / 'scripts' / 'textbook_chunks.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_chunks, f, indent=2, ensure_ascii=False)

    print(f"\n✅ Chunking complete!")
    print(f"📊 Total chunks: {len(all_chunks)}")
    print(f"💾 Saved to: {output_file}")

    # Calculate statistics
    total_tokens = sum(chunk['chunk_token_count'] for chunk in all_chunks)
    avg_tokens = total_tokens / len(all_chunks) if all_chunks else 0

    print(f"\n📈 Statistics:")
    print(f"  Total tokens: {total_tokens:,}")
    print(f"  Average tokens per chunk: {avg_tokens:.0f}")
    print(f"  Estimated embedding cost (text-embedding-3-small): ${(total_tokens / 1_000_000) * 0.02:.4f}")


if __name__ == "__main__":
    main()
