# Distributed Database System Project

### **MEMBERS**
- **Clarissa Albarracin**
- **Amor De Guzman**
- **Reina Althea Garcia**
- **Miko Santos**

---

### **Setup Instructions**
To set up the project environment, execute the following commands:

```bash
npm init -y
npm install babel body-parser cjs dotenv ejs express jest mysql2 puppeteer puppeteer-core
```

#### **Explanation:**
- **`npm init -y`**: Initializes a new Node.js project with default settings.
- **`npm install`**: Installs the listed dependencies:
  - **babel**: For JavaScript transpilation.
  - **body-parser**: Middleware for parsing incoming request bodies.
  - **cjs**: Support for CommonJS modules.
  - **dotenv**: For environment variable management.
  - **ejs**: Template engine for rendering HTML with JavaScript.
  - **express**: Framework for building the web application.
  - **jest**: Testing framework.
  - **mysql2**: Node.js MySQL client library.
  - **puppeteer** and **puppeteer-core**: For browser automation and testing.

---

### **Project Overview**
This project is a requisite machine course output for the **Advanced Database Systems** course. It applies concepts such as:
- **Concurrency control**
- **Recovery techniques**
- **Distributed systems**
- **Data replication**

The aim was to build a **distributed database system** capable of managing and supporting concurrent multi-user transactions. 

#### **Main Outputs:**
1. **Web Application**: Facilitates CRUD operations for managing persistent data elements using the Steam Games dataset.
2. **Test Scripts**: Simulate various cases for:
   - **Concurrency control and Consistency**
   - **Global failure and recovery**
3. **Technical Report**: Documents:
   - Process rationale.
   - Design decisions during implementation.

---

### **System Architecture**
The system consists of three nodes, each representing separate databases:

- **Node 1 (Central Node)**: Repository of **all data**.
- **Node 2**: Contains games released **before 2010**.
- **Node 3**: Contains games released **from 2010 onward**.

#### **Requirements:**
- Nodes must be implemented on three separate computers, interconnected for communication.
- Each node must operate independently while contributing to the distributed system.

---

### **Concurrency Control Simulation**
The web application simulates **global concurrency control** and **replication** through three main cases:

1. **Case #1**:  
   Concurrent transactions in two or more nodes are **reading the same data item**.

2. **Case #2**:  
   At least one transaction in the three nodes **modifies or deletes** a data item while concurrent transactions in other nodes are **reading the same data item**.

3. **Case #3**:  
   Concurrent transactions in two or more nodes are **writing (updating or deleting)** the same data item.

---

### **Global Failure and Recovery Simulation**
The system is extended to handle failure scenarios and recovery cases, including:

1. **Case #1**:  
   The **central node becomes unavailable** during a transaction, then comes back online.

2. **Case #2**:  
   **Node 2 or Node 3 becomes unavailable** during a transaction, then comes back online.

3. **Case #3**:  
   Failure in **writing to the central node** during transaction replication from Node 2 or Node 3.

4. **Case #4**:  
   Failure in **writing to Node 2 or Node 3** during transaction replication from the central node.

---

### **Key Features and Expected Results**
- **Concurrency Simulation**: Demonstrates how multiple nodes handle concurrent reads and writes while ensuring consistency.
- **Failure Handling**: Ensures the system recovers gracefully from node or communication failures.
- **Replication**: Synchronizes data across nodes to maintain global consistency.

This project integrates database design, distributed systems theory, and practical implementation to demonstrate a fully functional distributed database system.
```
