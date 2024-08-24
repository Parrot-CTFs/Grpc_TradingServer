Sure! Here's the updated README file with detailed setup instructions:

---

# Wall Street Hijack CTF

Welcome to the **Wall Street Hijack CTF**! This challenge is designed to test your skills in identifying and exploiting vulnerabilities in a simulated stock trading environment. Your goal is to uncover and exploit flaws within the system to achieve a series of objectives. Good luck!

## Table of Contents

- [Introduction](#introduction)
- [Setup Instructions](#setup-instructions)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Challenges](#challenges)
  - [1. Replay Attack](#1-replay-attack)
  - [2. Insufficient Balance Bypass](#2-insufficient-balance-bypass)
  - [3. Unauthorized Trading](#3-unauthorized-trading)
- [Hint](#hint)
- [Flags](#flags)
- [Disclaimer](#disclaimer)

## Introduction

In this CTF, you'll interact with a mock trading server named **Wall Street**, where users can buy and sell stocks. However, the server is not secure, and your task is to find and exploit the vulnerabilities within the system to achieve the following objectives:
1. Exploit a replay attack.
2. Bypass insufficient balance checks.
3. Perform unauthorized trading actions.

## Setup Instructions

### Prerequisites

Before you start, ensure that you have the following tools and software installed:

- **Node.js** (v18.12.0 or higher)
- **PostgreSQL** (for the database)
- **Docker** (for running Kafka and Zookeeper)
- **nmap** (for scanning the server)

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd kafka-chaos-ctf
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start Docker services**:
   Ensure that Docker is running and start the required services using Docker Compose:
   ```bash
   docker-compose up -d
   ```

4. **Create the Kafka Topic**:
   Inside your Kafka Docker container, create a topic named `stock-prices`:
   ```bash
   docker exec -it <kafka-container-id> /usr/bin/kafka-topics --create --topic stock-prices --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1
   ```

5. **Initialize Prisma**:
   Run the following command to set up Prisma in your project:
   ```bash
   npx prisma init
   ```

6. **Seed the Database**:
   Populate your PostgreSQL database with initial data using the Prisma seed file:
   ```bash
   npm run seed
   ```

7. **Start the Services**:
   Run the following command to start the Kafka producer, consumer, and the main gRPC server simultaneously:
   ```bash
   npm run start:all
   ```

   This command will:
   - Start the Kafka producer that generates random stock prices.
   - Start the Kafka consumer that listens to stock price updates.
   - Start the gRPC server that exposes the trading services.

8. **Verify Kafka Topics**:
   Ensure that the Kafka topics are correctly set up:
   ```bash
   docker exec -it <kafka-container-id> /usr/bin/kafka-topics --list --bootstrap-server localhost:9092
   ```

## Challenges

### 1. Replay Attack

In this challenge, you need to exploit the server by tampering with specific parameters to replay a previous trade. Identify the parameter and send the same trade request again to see if the server processes it as a new trade.

### 2. Insufficient Balance Bypass

Find a way to bypass the insufficient balance check during a buy trade. Your goal is to perform a trade without having the necessary funds.

### 3. Unauthorized Trading

Only the user **attacker** is allowed to perform trades. Try to execute buy and sell operations with this user. Observe the server's responses and determine how you can perform trades when you're not supposed to.

## Hint

For the **User Balance** endpoint, pay attention to the balance hint. The flag will be generated when you reach a balance of $200,000.

## Flags

- **Flag for $200,000 Balance**: Once you achieve a balance of $200,000, you will receive the flag in the User Balance response.

- **SSH Access Flag**: Hidden somewhere in the challenges, you might also find credentials for SSH access as a reward.

## Disclaimer

This CTF is for educational purposes only. It is intended to simulate a vulnerable environment where you can practice ethical hacking. Any unauthorized use of these techniques on real-world systems without permission is illegal.

---

This README file should now provide a comprehensive guide to setting up and running the Wall Street Hijack CTF, as well as a clear explanation of the challenges and objectives.
