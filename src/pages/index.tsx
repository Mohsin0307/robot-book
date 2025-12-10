import React from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import styles from './index.module.css';

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={styles.heroBanner}>
      <div className="container">
        <h1 className={styles.heroTitle}>
          Physical AI & Humanoid Robotics
        </h1>
        <p className={styles.heroSubtitle}>{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className={styles.buttonPrimary}
            to="/docs/intro">
            Start Learning →
          </Link>
          <Link
            className={styles.buttonSecondary}
            to="/docs/part1/chapter1-introduction">
            Jump to Chapter 1
          </Link>
        </div>
      </div>
    </header>
  );
}

function Feature({ title, description, icon }) {
  return (
    <div className={styles.feature}>
      <div className={styles.featureIcon}>{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className={styles.featureGrid}>
          <Feature
            icon="🤖"
            title="Comprehensive Curriculum"
            description="5 parts covering everything from foundational concepts to advanced humanoid robotics and practical projects."
          />
          <Feature
            icon="🧠"
            title="AI-Powered Learning"
            description="Integrated AI chatbot to answer your questions and provide personalized explanations based on your background."
          />
          <Feature
            icon="💻"
            title="Hands-On Projects"
            description="Build real robots: mobile robots, manipulation systems, humanoid walkers, and deploy vision-language-action models."
          />
          <Feature
            icon="📚"
            title="21 Detailed Chapters"
            description="Deep dive into sensors, actuators, kinematics, dynamics, control systems, computer vision, and deep learning."
          />
          <Feature
            icon="🌍"
            title="Multilingual Support"
            description="Translate chapters to Urdu (and more languages coming soon) with proper RTL formatting and technical accuracy."
          />
          <Feature
            icon="🎓"
            title="Adaptive Content"
            description="Content automatically adjusts to your education level - beginner, intermediate, or advanced learner."
          />
        </div>
      </div>
    </section>
  );
}

function TableOfContents() {
  return (
    <section className={styles.tocSection}>
      <div className="container">
        <h2 className={styles.tocTitle}>What You'll Learn</h2>
        <div className={styles.tocGrid}>
          <div className={styles.tocCard}>
            <h3>Part 1: Foundations of Physical AI</h3>
            <ul>
              <li>Introduction to Physical AI</li>
              <li>Sensors and Perception</li>
              <li>Actuators and Motion</li>
              <li>Computing Hardware</li>
            </ul>
            <Link to="/docs/part1/chapter1-introduction">Explore Part 1 →</Link>
          </div>
          <div className={styles.tocCard}>
            <h3>Part 2: Robotics Fundamentals</h3>
            <ul>
              <li>Kinematics</li>
              <li>Dynamics</li>
              <li>Control Systems</li>
              <li>Path Planning & Mapping</li>
            </ul>
            <Link to="/docs/part2/chapter1-kinematics">Explore Part 2 →</Link>
          </div>
          <div className={styles.tocCard}>
            <h3>Part 3: Humanoid Robotics</h3>
            <ul>
              <li>Bipedal Locomotion</li>
              <li>Balance and Stability</li>
              <li>Manipulation and Grasping</li>
              <li>Whole-Body Control</li>
            </ul>
            <Link to="/docs/part3/chapter1-bipedal-locomotion">Explore Part 3 →</Link>
          </div>
          <div className={styles.tocCard}>
            <h3>Part 4: AI for Robotics</h3>
            <ul>
              <li>Computer Vision</li>
              <li>Deep Learning for Robotics</li>
              <li>Imitation Learning</li>
              <li>Foundation Models</li>
            </ul>
            <Link to="/docs/part4/chapter1-computer-vision">Explore Part 4 →</Link>
          </div>
          <div className={styles.tocCard}>
            <h3>Part 5: Practical Projects</h3>
            <ul>
              <li>Mobile Robot Navigation</li>
              <li>Robotic Manipulation</li>
              <li>Humanoid Walking</li>
              <li>VLA Model Deployment</li>
            </ul>
            <Link to="/docs/part5/chapter1-project1-mobile-robot">Explore Part 5 →</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={`Home`}
      description="An AI-Native Textbook for Physical AI and Humanoid Robotics">
      <HomepageHeader />
      <main>
        <HomepageFeatures />
        <TableOfContents />
      </main>
    </Layout>
  );
}
