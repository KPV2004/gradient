# ⚡ Gradient: ระบบตรวจและจัดการแข่งขันเขียนโปรแกรม (Online Judge & Programming Contest Platform)

[![Go Version](https://img.shields.io/badge/Go-1.26+-00ADD8?style=for-the-badge&logo=go&logoColor=white)](https://golang.org)
[![React Version](https://img.shields.io/badge/React-v19-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-v6.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-v8.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev)
[![gRPC](https://img.shields.io/badge/gRPC-v1.81-blue?style=for-the-badge&logo=grpc&logoColor=white)](https://grpc.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg?style=for-the-badge)](file:///Users/kong/Documents/Project/gradient/LICENSE)

**Gradient** คือแพลตฟอร์มระบบตรวจการเขียนโปรแกรมและการแข่งขันเขียนโค้ดออนไลน์ (Online Judge & Programming Contest Platform) แบบ Full-stack ที่ประกอบด้วยระบบส่วนหน้า (Frontend) ที่ตอบสนองรวดเร็ว และระบบส่วนหลัง (Backend) แบบโครงสร้างแยกส่วนบริการ (Microservices Architecture) ที่เน้นประสิทธิภาพ ความปลอดภัยในการตรวจรหัสต้นฉบับ (Source Code) และความสามารถในการขยายระบบ

---

## 🏗️ สถาปัตยกรรมระบบ (System Architecture)

ระบบ Gradient ได้รับการออกแบบให้สอดคล้องตามหลักสถาปัตยกรรมที่ทันสมัยและปลอดภัย โดยแยกหน้าที่การทำงานออกจากกันดังแผนภาพด้านล่าง:

```mermaid
graph TD
    User([ผู้ใช้ / Frontend]) -->|HTTP REST API| CMS["CMS Service (Gin HTTP on :8080)"]
    CMS -->|1. บันทึกข้อมูลการส่ง| DB[(PostgreSQL)]
    CMS -->|2. สั่งตรวจโค้ดผ่าน gRPC| Grader["Grader Service (gRPC on :8081)"]
    
    subgraph Grader Engine (ระบบตรวจคำตอบ)
        Grader -->|3. ดึงโครงสร้างชุดทดสอบ| Config["Language Profiles (YAML)"]
        Grader -->|4. ควบคุมตู้คอนเทนเนอร์| Docker[Host Docker Daemon]
        Docker -->|5. รันโค้ดอย่างปลอดภัย| Sandbox["Docker Container (Isolated Sandbox)"]
    end
    
    Grader -->|6. ปรับปรุงสถานะและผลลัพธ์| DB
```

ระบบแบ่งออกเป็น 3 ภาคส่วนหลัก ได้แก่:
1. **[gradient-frontend](file:///Users/kong/Documents/Project/gradient/gradient-frontend)**: ส่วนติดต่อผู้ใช้งาน (User Interface) พัฒนาด้วย React, TypeScript และ Vite สำหรับจัดการและแสดงผลโจทย์ปัญหา การแข่งขัน บอร์ดคะแนนสะสม และการส่งคำตอบของนักเรียน/ผู้เข้าแข่งขัน
2. **CMS Service (ใน [gradient-backend](file:///Users/kong/Documents/Project/gradient/gradient-backend))**: ให้บริการ HTTP REST API สำหรับจัดการระบบสมาชิก (Authentication), การจัดการโจทย์ (Problems), ชุดทดสอบตัวอย่าง (Sample Testcases) และห้องแข่งขันเขียนโปรแกรม (Contests)
3. **Grader Service (ใน [gradient-backend](file:///Users/kong/Documents/Project/gradient/gradient-backend))**: ระบบการตรวจและประเมินผลผ่าน gRPC มีหน้าที่คอมไพล์และทดสอบรันรหัสต้นฉบับของผู้ใช้ในสภาพแวดล้อมจำลองที่ปิดและปลอดภัย (Isolated Docker Container Sandbox) ป้องกันโค้ดอันตราย (Malicious Code Execution) พร้อมการจำกัดปริมาณการใช้หน่วยความจำ (Memory Limit) และเวลา (Time Limit)

---

## 📁 โครงสร้างโฟลเดอร์ของโครงการ (Repository Structure)

โครงการนี้เป็นโครงสร้างแบบโมโนรีโพ (Monorepo) โดยแยกส่วนพัฒนาเป็นสัดส่วน ดังนี้:

```text
gradient/
├── LICENSE                     # สัญญาอนุญาตการใช้งานระบบ (Apache License 2.0)
├── README.md                   # เอกสารประกอบโครงการ (ไฟล์นี้)
│
├── gradient-backend/           # ระบบหลังบ้านพัฒนาด้วย Go และ gRPC
│   ├── apps/
│   │   ├── cms-service/        # บริการ REST API จัดการโจทย์และสมาชิก
│   │   ├── grader-service/     # บริการตรวจโค้ดผ่าน Docker Sandbox
│   │   └── shared/             # แพ็คเกจร่วม เช่น โครงสร้างฐานข้อมูล และโปรโตคอลบัฟเฟอร์ (Proto)
│   ├── database/               # สคริปต์จัดการโครงสร้างฐานข้อมูล (SQL Schema)
│   ├── .env.example            # ไฟล์ต้นแบบกำหนดค่าคอนฟิกสภาพแวดล้อม
│   └── docker-compose.yml      # ไฟล์รวมบริการฐานข้อมูลและแบ็กเอนด์ผ่าน Docker
│
└── gradient-frontend/          # ระบบหน้าบ้านพัฒนาด้วย React, TS และ Vite
    ├── src/                    # ซอร์สโค้ดฝั่งหน้าบ้าน (Components, Pages, API hooks)
    ├── package.json            # ไฟล์ระบุ Dependencies และ Scripts ฝั่งหน้าบ้าน
    └── tsconfig.json           # คอนฟิกูเรชันของ TypeScript
```

---

## 🛠️ ความต้องการพื้นฐานและการตั้งค่า (Prerequisites & Setup)

ก่อนเริ่มต้นติดตั้งและเปิดใช้งานระบบ กรุณาตรวจสอบและเตรียมความพร้อมของซอฟต์แวร์เหล่านี้ในเครื่องคอมพิวเตอร์ของคุณ:

* **Go (เวอร์ชัน 1.26 ขึ้นไป)**
* **Node.js (LTS)** และโปรแกรมจัดการแพ็คเกจ (**npm** หรือ **yarn**)
* **Docker / Docker Desktop** (จำเป็นอย่างยิ่งสำหรับการทำงานของ Grader Engine ในการรัน Sandbox)
* **PostgreSQL (เวอร์ชัน 15 ขึ้นไป)** (หากเลือกติดตั้งแบบพัฒนาระดับเครื่องโลคัล)

---

## 🚀 ขั้นตอนการติดตั้งและเปิดใช้งาน (Getting Started)

> [!IMPORTANT]
> **ระบบตรวจโค้ด (Grader Service) จำเป็นต้องมี Docker Daemon ทำงานอยู่เสมอ** เพื่อใช้รันรหัสต้นฉบับของผู้สมัครสอบในตู้คอนเทนเนอร์แยกส่วนอย่างปลอดภัย

### วิธีที่ 1: ติดตั้งผ่าน Docker Compose (แนะนำสำหรับทดสอบและใช้งานด่วน)

วิธีนี้เป็นวิธีที่ง่ายที่สุด ระบบจะเตรียมฐานข้อมูล PostgreSQL ติดตั้ง Schema เริ่มต้น และรัน CMS Service กับ Grader Service พร้อมกันให้อัตโนมัติ:

1. ย้ายเข้าไปในโฟลเดอร์ระบบหลังบ้าน:
   ```bash
   cd gradient-backend
   ```
2. คัดลอกและตั้งค่าสภาพแวดล้อมเริ่มต้น:
   ```bash
   cp .env.example .env
   ```
3. สั่งรันบริการทั้งหมดผ่าน Docker Compose:
   ```bash
   docker-compose up --build
   ```
   * **CMS REST API** จะเริ่มทำงานที่: `http://localhost:8080`
   * **Grader gRPC Service** จะเริ่มทำงานที่: `localhost:8081`
   * **PostgreSQL** จะดึง Schema จาก [schema.sql](file:///Users/kong/Documents/Project/gradient/gradient-backend/database/schema.sql) มารันตั้งค่าเริ่มต้นโดยอัตโนมัติ

---

### วิธีที่ 2: ติดตั้งแบบแยกส่วนสำหรับการพัฒนา (Local Development)

หากต้องการแก้ไขซอร์สโค้ดและทดสอบระบบแบบ Real-time แนะนำให้ติดตั้งแบบแยกส่วนดังนี้:

#### 1. การเตรียมและจัดการฝั่งหลังบ้าน (Backend)
1. เปิดฐานข้อมูล PostgreSQL ในเครื่องของคุณ จากนั้นสร้างฐานข้อมูลเปล่าชื่อ `gradient`
2. นำเข้าฐานข้อมูลเริ่มต้นด้วยคำสั่ง:
   ```bash
   psql -u [ชื่อผู้ใช้] -d gradient -f gradient-backend/database/schema.sql
   ```
3. คัดลอกไฟล์คอนฟิกูเรชันใน [gradient-backend](file:///Users/kong/Documents/Project/gradient/gradient-backend):
   ```bash
   cd gradient-backend
   cp .env.example .env
   ```
   *แก้ไขไฟล์ `.env` เพื่อให้การเชื่อมต่อกับฐานข้อมูลถูกต้อง*
4. เปิดการทำงานของ Grader Service (gRPC):
   ```bash
   go run apps/grader-service/main.go
   ```
5. เปิดการทำงานของ CMS Service (REST API) ใน Terminal ใหม่:
   ```bash
   go run apps/cms-service/main.go
   ```

#### 2. การเตรียมและจัดการฝั่งหน้าบ้าน (Frontend)
1. ย้ายเข้าสู่โฟลเดอร์ [gradient-frontend](file:///Users/kong/Documents/Project/gradient/gradient-frontend):
   ```bash
   cd gradient-frontend
   ```
2. ติดตั้งโมดูลและแพ็คเกจพึ่งพาภายนอก:
   ```bash
   npm install
   # or
   bun install
   ```
3. รันเซิร์ฟเวอร์พัฒนาระบบหน้าบ้าน:
   ```bash
   npm run dev
   # or
   bun run dev
   ```
   *ระบบส่วนหน้าพร้อมใช้จะแสดง URL ในหน้าต่าง Terminal (ปกติคือ `http://localhost:5173`)*

---

## 📡 สรุปเส้นทางการให้บริการข้อมูล (API Endpoints Summary)

ในการเรียกใช้ API (ยกเว้น API สมัครสมาชิกและล็อกอิน) จำเป็นต้องแนบโทเคนยืนยันสิทธิ์ใน HTTP Header รูปแบบ: `Authorization: Bearer <JWT_TOKEN>`

| เส้นทาง API | วิธีการ (Method) | สิทธิ์เข้าใช้งาน (Access Role) | คำอธิบายรายละเอียดบริการ |
| :--- | :---: | :---: | :--- |
| **`/api/auth/register`** | `POST` | ทั่วไป (Public) | สมัครบัญชีผู้ใช้งานใหม่ในระบบ |
| **`/api/auth/login`** | `POST` | ทั่วไป (Public) | ลงชื่อเข้าใช้งาน เพื่อรับ JWT Access Token |
| **`/api/auth/me`** | `GET` | ทุกระดับสิทธิ์ | ตรวจสอบข้อมูลส่วนตัวของผู้ลงชื่อเข้าใช้ปัจจุบัน |
| **`/api/problems`** | `GET` | ทุกระดับสิทธิ์ | ดูรายการโจทย์ทั้งหมด (นักเรียนเห็นเฉพาะโจทย์ที่เปิดเผยแล้ว) |
| **`/api/problems/:id`** | `GET` | ทุกระดับสิทธิ์ | ดูรายละเอียดโจทย์เฉพาะและข้อมูลชุดทดสอบตัวอย่าง |
| **`/api/problems`** | `POST` | อาจารย์ / ผู้ดูแลระบบ | สร้างและเพิ่มโจทย์ข้อใหม่เข้าระบบ |
| **`/api/problems/:id/testcases`**| `POST` | อาจารย์ / ผู้ดูแลระบบ | อัปโหลดและตั้งค่าชุดข้อมูลตัวอย่างที่ใช้ตรวจโปรแกรม |
| **`/api/contests`** | `GET` | ทุกระดับสิทธิ์ | แสดงรายชื่อสนามสอบหรือการแข่งขันทั้งหมด |
| **`/api/contests/:id/join`** | `POST` | นักเรียน / นักศึกษา | สมัครเข้าร่วมการแข่งขันตามรหัสการแข่งขัน |
| **`/api/contests`** | `POST` | อาจารย์ / ผู้ดูแลระบบ | สร้างการแข่งขันเขียนโปรแกรมใหม่ |
| **`/api/submissions`** | `POST` | นักเรียน / นักศึกษา | ส่งรหัสต้นฉบับโค้ดวิเคราะห์ เพื่อนำไปตรวจผล |
| **`/api/submissions/:id`** | `GET` | ทุกระดับสิทธิ์ | ติดตามดูประวัติและคะแนนที่ตรวจจากระบบ Grader |

---

## 🛡️ รายละเอียดภาษาและชุดทดลองที่ระบบรองรับ (Language Profiles Supported)

ระบบตรวจข้อสอบรองรับการวิเคราะห์หลายภาษา โดยกำหนดโครงสร้างและการรัน Sandbox ใน [sandbox_profiles.yaml](file:///Users/kong/Documents/Project/gradient/gradient-backend/apps/grader-service/config/sandbox_profiles.yaml) ดังนี้:

* **C++ (v13 GCC)**
* **Go (v1.21 golang)**
* **Python (v3.11)**
* **JavaScript (Node v20)**

---

## ⚖️ สัญญาอนุญาต (License)

โครงการนี้อยู่ภายใต้เงื่อนไขและข้อกำหนดการใช้งานแบบ **[Apache License 2.0](file:///Users/kong/Documents/Project/gradient/LICENSE)** รายละเอียดเพิ่มเติมสามารถอ่านได้ในไฟล์ใบอนุญาตแนบมาในส่วนนำเสนอหลักของโครงการ
