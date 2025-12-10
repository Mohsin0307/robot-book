/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */

// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  tutorialSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Part 1: Foundations of Physical AI',
      items: [
        'part1/chapter1-introduction',
        'part1/chapter2-sensors',
        'part1/chapter3-actuators',
        'part1/chapter4-computing',
      ],
    },
    {
      type: 'category',
      label: 'Part 2: Robotics Fundamentals',
      items: [
        'part2/chapter1-kinematics',
        'part2/chapter2-dynamics',
        'part2/chapter3-control-systems',
        'part2/chapter4-path-planning',
        'part2/chapter5-localization-mapping',
      ],
    },
    {
      type: 'category',
      label: 'Part 3: Humanoid Robotics',
      items: [
        'part3/chapter1-bipedal-locomotion',
        'part3/chapter2-balance-stability',
        'part3/chapter3-manipulation-grasping',
        'part3/chapter4-whole-body-control',
      ],
    },
    {
      type: 'category',
      label: 'Part 4: AI for Robotics',
      items: [
        'part4/chapter1-computer-vision',
        'part4/chapter2-deep-learning-robotics',
        'part4/chapter3-imitation-learning',
        'part4/chapter4-foundation-models',
      ],
    },
    {
      type: 'category',
      label: 'Part 5: Practical Projects',
      items: [
        'part5/chapter1-project1-mobile-robot',
        'part5/chapter2-project2-manipulation',
        'part5/chapter3-project3-humanoid-walking',
        'part5/chapter4-project4-vla-deployment',
      ],
    },
  ],
};

module.exports = sidebars;
