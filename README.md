# ⚡ Gradient: ระบบตรวจและจัดการแข่งขันเขียนโปรแกรม (Online Judge & Programming Contest Platform)

[![Go Version](https://img.shields.io/badge/Go-1.26+-00ADD8?style=for-the-badge&logo=go&logoColor=white)](https://golang.org)
[![React Version](https://img.shields.io/badge/React-v19-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-v6.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-v8.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev)
[![gRPC](https://img.shields.io/badge/gRPC-v1.81-blue?style=for-the-badge&logo=grpc&logoColor=white)](https://grpc.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg?style=for-the-badge)](file:///Users/kong/Documents/Project/gradient/LICENSE)

**Gradient** คือแพลตฟอร์มระบบตรวจการเขียนโปรแกรมและการแข่งขันเขียนโค้ดออนไลน์ (Online Judge) แบบ Full-stack โดยใช้โครงสร้าง Microservices พัฒนาด้วยภาษา Go ในฝั่งระบบหลังบ้าน และใช้ React + TypeScript ในระบบฝั่งหน้าบ้าน

---

## 📁 โครงสร้างโปรเจกต์ (Project Structure)

โปรเจกต์นี้จัดการโค้ดแบบ Monorepo แบ่งออกเป็น 2 ส่วนหลัก:

* **[gradient-frontend](file:///Users/kong/Documents/Project/gradient/gradient-frontend)**: ส่วนติดต่อผู้ใช้งาน พัฒนาด้วย React, TypeScript และ Vite
* **[gradient-backend](file:///Users/kong/Documents/Project/gradient/gradient-backend)**: ระบบหลังบ้านพัฒนาด้วย Go และ gRPC ประกอบด้วย:
  * **CMS Service**: บริการ REST API จัดการโจทย์ ผู้ใช้ และการแข่งขัน
  * **Grader Service**: บริการตรวจโค้ดของผู้ใช้ผ่านระบบจำลองที่ปลอดภัย (Docker Sandbox)

---

## 🛠️ สิ่งที่ต้องเตรียมก่อนติดตั้ง (Prerequisites)

* **Go (1.26 ขึ้นไป)**
* **Node.js (LTS)**
* **Docker / Docker Desktop** (จำเป็นอย่างยิ่งสำหรับการทำงานของระบบตรวจโค้ด)
* **PostgreSQL (15 ขึ้นไป)**

---

## 🚀 วิธีการเปิดใช้งานระบบ (Getting Started)

> [!IMPORTANT]
> **กรุณาเปิดใช้ Docker Daemon ก่อนเริ่มรันระบบเสมอ** เพื่อให้ Grader Service สามารถรันโค้ดผู้ใช้ใน Sandbox ได้อย่างถูกต้อง

### วิธีที่ 1: รันผ่าน Docker Compose (แนะนำและง่ายที่สุด)

1. เข้าไปยังโฟลเดอร์ของระบบหลังบ้าน:
   ```bash
   cd gradient-backend
   ```
2. คัดลอกไฟล์ตั้งค่า Environment:
   ```bash
   cp .env.example .env
   ```
3. สั่งรันระบบทั้งหมด:
   ```bash
   docker-compose up --build
   ```
   * **CMS Service (HTTP API)** จะรันอยู่ที่: `http://localhost:8080`
   * **Grader Service (gRPC)** จะรันอยู่ที่: `localhost:8081`
   * **PostgreSQL** จะดึงโครงสร้างตารางข้อมูลเริ่มต้นจาก [schema.sql](file:///Users/kong/Documents/Project/gradient/gradient-backend/database/schema.sql) มาติดตั้งให้อัตโนมัติ

---

### วิธีที่ 2: รันแยกทีละบริการ (สำหรับนักพัฒนา)

#### 1. ฝั่งระบบหลังบ้าน (Backend)
1. นำเข้าตารางข้อมูลเริ่มต้นเข้าสู่ PostgreSQL ในเครื่อง:
   ```bash
   psql -u [username] -d gradient -f gradient-backend/database/schema.sql
   ```
2. ตั้งค่าไฟล์สภาพแวดล้อม:
   ```bash
   cd gradient-backend
   cp .env.example .env
   ```
3. รัน Grader Service (gRPC):
   ```bash
   go run apps/grader-service/main.go
   ```
4. รัน CMS Service (REST API) ในอีกหน้าต่าง Terminal:
   ```bash
   go run apps/cms-service/main.go
   ```

#### 2. ฝั่งระบบหน้าบ้าน (Frontend)
1. เข้าไปในโฟลเดอร์ [gradient-frontend](file:///Users/kong/Documents/Project/gradient/gradient-frontend):
   ```bash
   cd gradient-frontend
   ```
2. ติดตั้ง Dependencies และเริ่มทำงาน:
   ```bash
   npm install
   npm run dev
   ```
   *ระบบส่วนหน้าจะรันที่พอร์ตพัฒนาเริ่มต้น (ปกติคือ `http://localhost:5173`)*

---

## 📡 รายการ API สำคัญ (Key API Endpoints)

| API Route | Method | Access Role | Description |
| :--- | :---: | :---: | :--- |
| `/api/auth/register` | `POST` | Public | สมัครบัญชีสมาชิกใหม่ |
| `/api/auth/login` | `POST` | Public | ลงชื่อเข้าใช้เพื่อรับ JWT Token |
| `/api/problems` | `GET` | ทุกสิทธิ์ | เรียกดูรายการโจทย์ในระบบ |
| `/api/problems` | `POST` | Teacher / Admin | สร้างโจทย์ข้อใหม่ |
| `/api/problems/:id/testcases` | `POST` | Teacher / Admin | ตั้งค่าข้อมูลชุดทดสอบ |
| `/api/contests` | `POST` | Teacher / Admin | ตั้งห้องจัดประกวดแข่งขันเขียนโปรแกรม |
| `/api/submissions` | `POST` | Student | ส่งซอร์สโค้ดเพื่อเริ่มทำการตรวจผล |
| `/api/submissions/:id` | `GET` | ทุกสิทธิ์ | ตรวจดูผลการตรวจและคะแนนของโปรแกรม |

---

## 🛡️ ภาษาที่ระบบตรวจรองรับ (Supported Languages)

คุณสามารถตั้งค่าสภาวะการทำงานของแต่ละภาษาผ่านไฟล์ YAML ได้ที่ [sandbox_profiles.yaml](file:///Users/kong/Documents/Project/gradient/gradient-backend/apps/grader-service/config/sandbox_profiles.yaml) ปัจจุบันระบบตรวจคำตอบรองรับ:
* **C++** (GCC 13)
* **Go** (Golang 1.21)
* **Python** (3.11)
* **JavaScript** (Node 20)

---

## ⚖️ สัญญาอนุญาต (License)

โครงการนี้พัฒนาและเผยแพร่ภายใต้ใบอนุญาต **[Apache License 2.0](file:///Users/kong/Documents/Project/gradient/LICENSE)**
