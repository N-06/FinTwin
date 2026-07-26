# FinTwin

## Overview
FinTwin is a financial technology application designed to function as a "digital financial twin." It enables users to manage personal finances, and receive personalized wealth management strategies through intelligent, agentic architectures. 

## Core Features
*   **Intelligent Onboarding:** A dynamic, multi-step wizard designed to systematically gather and analyze user financial profiles and risk tolerance.
*   **Comprehensive Financial Tracking:** Dedicated modules for budget tracking and overall financial health and risk assessment.
*   **AI Persona Advisors:** Natural language interfaces powered by LLMs that simulate conversations with digital twins of legendary financial figures (e.g., Warren Buffett, Ray Dalio) to provide tailored investment strategies.
*   **Decentralized Agent Clustering:** Leverages multiple AI agent clusters, including the GaiaNet public node, to route queries in real-time. This provides users with dynamic, contrasting viewpoints for strategic financial decision-making.

## Technology Stack
*   **Frontend Architecture:** React, Vite
*   **UI & Styling:** Tailwind CSS
*   **Data Visualization:** Recharts
*   **AI & Logic Integration:** Llama2, AI SDKs, Decentralized Agent Nodes (GaiaNet)


## Installation & Local Development

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/N-06/finTwin.git](https://github.com/N-06/FinTwin.git)
    cd FinTwin
    ```
2. **Set Up and Activate the Environment**:
    ```bash
    python -m venv venv
    .\venv\Scripts\Activate.ps1
    ```

3.  **Install dependencies:**
    ```bash
    npm install
    ```

4.  **Environment Configuration:**
    *   Create a `.env` file in the root directory.
    *   Securely add your required API keys
    *   *Note: Never commit your `.env` file to version control.*

5.  **Start the development server:**
    ```bash
    npm run dev
    ```

## Contributing
Contributions, issue reports, and feature requests are welcome. Please ensure that any new components or logic modules follow the established directory structure and maintain secure handling of environment variables.
