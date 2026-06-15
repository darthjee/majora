# majora
Repository for information for RP games

[![Build Status](https://circleci.com/gh/darthjee/majora.svg?style=shield)](https://circleci.com/gh/darthjee/majora)
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/278660c8eee94fe88bd0cb08d21de71f)](https://app.codacy.com/gh/darthjee/majora/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_grade)

![majora](https://raw.githubusercontent.com/darthjee/oak/master/majora.png)

**Current Version:** [0.0.1](https://github.com/darthjee/majora/releases/tag/0.0.1)

**Next Release:** [0.0.2](https://github.com/darthjee/majora/compare/0.0.1...main)

## About

## Technology Stack

- **Python/Django** — Main application framework
- **MySQL 9.3.0** — Relational database
- **React + Bootstrap** - Frontend
- **Docker & Docker Compose** — Containerization and orchestration

## Project Structure

## Development Setup

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/) installed

### First Time Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/darthjee/majora.git
   cd oak
   ```

2. Run project setup (creates `.env` from `.env.example`, installs dependencies, and prepares the database):
   ```bash
   make setup
   ```

3. Review and adjust `.env` values if needed.
