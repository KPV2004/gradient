# ⚡ Gradient: ระบบตรวจและจัดการแข่งขันเขียนโปรแกรม (Online Judge Platform)

[![Go Version](https://img.shields.io/badge/Go-1.22+-00ADD8?style=for-the-badge&logo=go&logoColor=white)](https://golang.org)
[![React Version](https://img.shields.io/badge/React-v19-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-v6.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-v8.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev)
[![gRPC](https://img.shields.io/badge/gRPC-v1.81-blue?style=for-the-badge&logo=grpc&logoColor=white)](https://grpc.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com)
[![Bun](https://img.shields.io/badge/Bun-v1.1+-f9f1e7?style=for-the-badge&logo=bun&logoColor=black)](https://bun.sh)

**Gradient** คือแพลตฟอร์มระบบตรวจการเขียนโปรแกรมและการจัดการแข่งขันออนไลน์ (Online Judge) แบบ Full-stack โดยแยกโครงสร้างเป็น Microservices เพื่อรองรับการทำงานที่มีประสิทธิภาพและปลอดภัยสูง พัฒนาด้วยภาษา Go ในฝั่งระบบหลังบ้าน และใช้ React + TypeScript + Monaco Editor รันบน Bun ในฝั่งระบบหน้าบ้าน

---

## 📁 โครงสร้างโปรเจกต์ (Project Structure)

โปรเจกต์นี้จัดการโค้ดแบบ Monorepo แบ่งออกเป็น 2 ส่วนหลัก:

*   **[gradient-frontend](file:///Users/kong/Documents/Project/gradient/gradient-frontend)**: ระบบหน้าบ้านและ UI Workspace แบบ LeetCode-style (React 19, TypeScript, Bun, Monaco Editor)
*   **[gradient-backend](file:///Users/kong/Documents/Project/gradient/gradient-backend)**: ระบบหลังบ้านพัฒนาด้วย Go และ gRPC ประกอบด้วย:
    *   **CMS Service**: บริการ REST API จัดการโจทย์ ผู้ใช้ การส่งคำตอบ และการแข่งขัน
    *   **Grader Service**: บริการตรวจโค้ดผ่านระบบจำลองสภาพแวดล้อมความปลอดภัยสูง (Docker Sandbox)

---

## 🛠️ สิ่งที่ต้องเตรียมก่อนติดตั้ง (Prerequisites)

*   **Go (1.22 ขึ้นไป)**
*   **Bun (1.1 ขึ้นไป)** (แนะนำสำหรับการประมวลผล Frontend ที่รวดเร็ว)
*   **Docker / Docker Desktop** (จำเป็นอย่างยิ่งสำหรับ Grader Service ในการใช้สร้าง Sandbox)
*   **PostgreSQL (15 ขึ้นไป)**

---

## 🚀 วิธีการเปิดใช้งานระบบ (Getting Started)

> [!IMPORTANT]
> **กรุณาเปิดใช้ Docker Daemon ก่อนเริ่มรันระบบเสมอ** เพื่อให้ Grader Service สามารถรันโค้ดผู้ใช้ใน Sandbox ได้อย่างถูกต้อง

### วิธีที่ 1: รันผ่าน Docker Compose (แนะนำและง่ายที่สุด)

1.  คัดลอกไฟล์ตั้งค่า Environment ของหลังบ้าน:
    ```bash
    cd gradient-backend
    cp .env.example .env
    cd ..
    ```
2.  สั่งรันระบบทั้งหมด:
    ```bash
    docker-compose up --build
    ```
    *   **CMS Service (HTTP API)** จะรันอยู่ที่: `http://localhost:8080`
    *   **Grader Service (gRPC)** จะรันอยู่ที่: `localhost:8081`
    *   **Frontend Web App** จะรันอยู่ที่: `http://localhost:5173`
    *   **PostgreSQL** จะดึงโครงสร้างตารางข้อมูลเริ่มต้นจาก [database/schema.sql](file:///Users/kong/Documents/Project/gradient/gradient-backend/database/schema.sql) มาติดตั้งให้อัตโนมัติ

---

### วิธีที่ 2: รันแยกแต่ละบริการ (สำหรับการพัฒนา - Development)

#### 1. ฝั่งระบบหลังบ้าน (Backend)
1.  นำเข้าตารางข้อมูลเริ่มต้นเข้าสู่ PostgreSQL ในเครื่อง:
    ```bash
    psql -U [username] -d gradient -f gradient-backend/database/schema.sql
    ```
2.  ตั้งค่าไฟล์สภาพแวดล้อม:
    ```bash
    cd gradient-backend
    cp .env.example .env
    ```
3.  รัน Grader Service (gRPC):
    ```bash
    go run apps/grader-service/main.go
    ```
4.  รัน CMS Service (REST API) ในอีก Terminal window:
    ```bash
    go run apps/cms-service/main.go
    ```

#### 2. ฝั่งระบบหน้าบ้าน (Frontend)
1.  เข้าไปยังโฟลเดอร์หน้าบ้าน:
    ```bash
    cd gradient-frontend
    ```
2.  ติดตั้ง Dependencies และสั่งรันพัฒนาด้วย Bun:
    ```bash
    bun install
    bun run dev
    ```
    *   หน้าเว็บพัฒนาจะพร้อมใช้งานที่: `http://localhost:5173`

---

## 📡 รายการ API สำคัญ (Key API Endpoints)

ทุก ๆ เส้นทาง API (ยกเว้น Register และ Login) จำเป็นต้องส่ง JWT Token ใน Header รูปแบบ: `Authorization: Bearer <your-jwt-token>`

| API Route | Method | Access Role | Description |
| :--- | :---: | :---: | :--- |
| `/api/auth/register` | `POST` | Public | สมัครบัญชีสมาชิกใหม่ |
| `/api/auth/login` | `POST` | Public | ลงชื่อเข้าใช้เพื่อรับ JWT Token |
| `/api/auth/me` | `GET` | ทุกสิทธิ์ | ดึงข้อมูลผู้ใช้ปัจจุบันที่ล็อกอินอยู่ |
| `/api/problems` | `GET` | ทุกสิทธิ์ | เรียกดูรายการโจทย์ในระบบ |
| `/api/problems/:id` | `GET` | ทุกสิทธิ์ | แสดงรายละเอียดโจทย์และข้อมูลตัวอย่าง |
| `/api/problems` | `POST` | Teacher / Admin | สร้างโจทย์ข้อใหม่ |
| `/api/problems/:id` | `PUT` | Teacher / Admin | แก้ไขข้อมูลโจทย์เดิม |
| `/api/problems/:id` | `DELETE` | Teacher / Admin | ลบโจทย์ออกจากระบบ |
| `/api/problems/:id/testcases` | `POST` | Teacher / Admin | ตั้งค่า/เพิ่มข้อมูลชุดทดสอบ |
| `/api/problems/:id/testcases/:tcId` | `DELETE` | Teacher / Admin | ลบชุดทดสอบ (Testcase) ของโจทย์ |
| `/api/contests` | `GET` | ทุกสิทธิ์ | เรียกดูการแข่งขันทั้งหมด |
| `/api/contests/:id` | `GET` | ทุกสิทธิ์ | แสดงรายละเอียดของการแข่งขัน |
| `/api/contests` | `POST` | Teacher / Admin | สร้างห้องแข่งขันโปรแกรมใหม่ |
| `/api/contests/:id` | `PUT` | Teacher / Admin | แก้ไขรายละเอียดของการแข่งขัน |
| `/api/contests/:id` | `DELETE` | Teacher / Admin | ลบห้องแข่งขันออกจากระบบ |
| `/api/submissions` | `POST` | Student | ส่งซอร์สโค้ดเพื่อเริ่มทำการตรวจผล |
| `/api/submissions/:id` | `GET` | ทุกสิทธิ์ | ติดตามและเรียกดูรายละเอียดผลการตรวจ |

---

## 🛡️ ภาษาที่ระบบตรวจคำตอบรองรับ (Supported Languages)

สภาวะการทำงานของแต่ละภาษาถูกควบคุมผ่าน Docker Container Profiles ที่ไฟล์ [sandbox_profiles.yaml](file:///Users/kong/Documents/Project/gradient/gradient-backend/apps/grader-service/config/sandbox_profiles.yaml) ปัจจุบันระบบรองรับ:

*   **C** (GCC 13 / `gcc:13-bookworm`)
*   **C++** (GCC 14 / `gcc:14-bookworm`)
*   **Go** (Golang 1.22 / `golang:1.22-bookworm`)
*   **Java** (OpenJDK 17 / `openjdk:17-slim`)
*   **Python** (Python 3.11 / `python:3.11-slim`)
*   **Rust** (Rust 1.75 / `rust:1.75-slim`)
*   **JavaScript** (Node 20 / `node:20-alpine`)

---

## ⚖️ สัญญาอนุญาต (License)

โครงการนี้พัฒนาและเผยแพร่ภายใต้ใบอนุญาต **[Apache License 2.0](file:///Users/kong/Documents/Project/gradient/LICENSE)**
