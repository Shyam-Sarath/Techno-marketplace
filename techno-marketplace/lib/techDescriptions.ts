export const techDescriptions: Record<string, string> = {
  // Category A - Core Technologies
  'Computer Vision': 'Processing and analyzing digital images or videos to extract high-dimensional data, perform object detection, and interpret visual inputs.',
  'Digital Twin & Simulation': 'Constructing virtual digital replicas of physical assets, processes, or entire systems to run real-time simulations, tests, and stress analyses.',
  'AR / VR & Immersive Systems': 'Blending physical environments with digital graphics (augmented reality) or building fully simulated environments (virtual reality) for training and interaction.',
  'Geospatial Intelligence': 'Utilizing satellite imagery, GPS mapping, and spatial databases to analyze human activity, geographical patterns, and physical locations.',
  'Optimization & Decision Systems': 'Utilizing linear programming, heuristics, and mathematical modeling to find the most efficient allocation of resources and optimal solutions.',
  'Edge Computing': 'Decentralizing data processing by computing workloads closer to the data source rather than relying solely on a centralized cloud database, reducing latency.',
  'AI / Machine Learning': 'Harnessing statistical models, deep neural networks, and training algorithms to enable systems to learn and adapt from data without explicit instructions.',
  'IoT & Sensor Systems': 'Creating networks of physical objects embedded with sensors, software, and hardware to connect and exchange real-time environmental data.',
  'Robotics & Autonomous Systems': 'Developing intelligent physical machines that can perform tasks, navigate complex environments, and automate mechanical processes independently.',
  'Predictive & Recommendation Systems': 'Deploying forecasting models and collaborative filtering algorithms to analyze user behaviors and project future trends or content preferences.',
  'Blockchain & Decentralized Systems': 'Designing secure, tamper-proof distributed ledgers and peer-to-peer transaction mechanisms to enable trustless validation and tracking.',
  'Human-Computer Interaction': 'Designing intuitive interfaces, voice recognition, gesture controls, and sensory feedback mechanisms to optimize how humans interact with machines.',


  // Category B - Support Technologies
  'Database & Data Storage': 'Setting up highly scalable, secure SQL/NoSQL databases and data lakes to store, query, and retrieve structural and unstructured records.',
  'API & External Integrations': 'Building robust REST/GraphQL gateways, webhooks, and third-party integrations to connect separate platforms and pass payload data.',
  'Cloud Infrastructure': 'Deploying scalable server hosting, CDN distribution, and computing nodes across remote data centers like AWS, Azure, or GCP.',
  'Cybersecurity': 'Implementing firewalls, vulnerability testing, intrusion detection, and active threat monitoring to protect infrastructure and databases.',
  'Authentication & Identity': 'Integrating multi-factor login credentials, OAuth validation, single sign-on, and role-based access controls to secure user accounts.',
  'Voice Interface': 'Setting up natural language processing, speech-to-text converters, and conversational speech models to enable audio command controls.',
  'Notification & Communication': 'Setting up automated email alerts, push notifications, and SMS triggers to keep teams and clients updated instantly.',
  'Payment & Transaction System': 'Integrating secure checkouts, payment gateways, invoice generators, and refund processors to manage financial transactions.',
  'Real-Time Communication': 'Enabling instantaneous data streaming, WebSockets, webRTC calls, and live chat features between active connected users.',
  'Analytics & Visualization': 'Building data dashboards, charts, and reporting structures to turn raw logs into actionable business insights.',
  'Workflow & Automation': 'Designing conditional task triggers, cron jobs, and background workers to handle repetitive system events automatically.',
  'UI/UX & Prototyping': 'Designing responsive layouts, modular styles, accessibility overlays, and component design systems to deliver user-friendly interfaces.'
};

export function getTechDescription(name: string): string {
  return techDescriptions[name] || 'A cutting-edge technology component designed to integrate into the solution stack.';
}
