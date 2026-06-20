# 🎨 Gradient Frontend (React 19 + TypeScript + Vite + Bun)

ระบบหน้าบ้าน (Frontend Web Application) สำหรับแพลตฟอร์ม **Gradient Online Judge** ที่มุ่งเน้นความเป็นมิตรต่อการใช้งาน มีระบบความปลอดภัย และให้ความพึงพอใจด้านความสวยงาม (User Experience) ด้วยการจัดพื้นที่สไตล์ LeetCode และระบบตรวจแบบเรียลไทม์ (Real-time Submission Polling)

---

## ✨ คุณสมบัติเด่น (Key Features)

*   **💻 LeetCode-style Workspace**: พื้นที่ทำโจทย์แบ่งครึ่งหน้าจอ (Split Workspace) ประกอบด้วย:
    *   **ฝั่งซ้าย**: แท็บสลับดูรายละเอียดโจทย์ (Problem Statement), ตัวอย่างผลลัพธ์ (Sample Cases) และประวัติการส่งโค้ด (Submissions History) ของผู้ส่งรายนั้นๆ
    *   **ฝั่งขวา**: Monaco Code Editor พร้อมแผงควบคุมและคอนโซลแจ้งผลการตรวจคำตอบ (Grader Console) แบบครบวงจรในหน้าเดียว
*   **📝 Monaco Code Editor Integration**: ใช้งานเครื่องมือเขียนโค้ดมาตรฐานระดับโลก (ตัวเดียวกับ VS Code) รองรับ:
    *   การทำ Highlight ไวยากรณ์ตามภาษาเขียนโปรแกรมที่เลือกโดยอัตโนมัติ
    *   การปรับขนาดตัวอักษรและการควบคุมปุ่มลัด (Keyboard Shortcuts)
    *   การปรับเปลี่ยนสีธีมตามสภาวะระบบ (Dark Mode / Light Mode)
*   **⏱️ Real-time Polling & Grader Metrics**: แสดงผลลัพธ์การตรวจแบบวินาทีต่อวินาที (Pending ➡️ Compiling ➡️ Running ➡️ Score/Verdict) โดยระบบการเรียกสอบ HTTP API ดึงข้อมูลเป็นระยะโดยอัตโนมัติ และแสดงจำนวนการผ่านชุดทดสอบแบบไลฟ์สตรีม
*   **🌗 Adaptive Design System (Vanilla CSS)**: การออกแบบระดับพรีเมียมที่ปราศจาก Tailwind CSS ปรับแต่งสีและเลย์เอาต์ผ่าน CSS Variables ทำความเร็วได้รวดเร็วและสนับสนุนสภาวะ Light/Dark Mode ที่เก็บค่าไว้ใน LocalStorage เสมอ
*   **🔐 Role-Based Access Control**:
    *   **นักเรียน (Student)**: แก้โจทย์ แข่งขัน ส่งโค้ด และตรวจสอบประวัติการส่งของตนเอง
    *   **ผู้สอน/ผู้ดูแล (Teacher/Admin)**: สิทธิ์การเข้าถึง Admin Panel สำหรับการเพิ่ม ลบ หรือแก้ไขข้อมูลโจทย์ การตั้งค่าไฟล์ข้อมูลชุดทดสอบ (Testcase Manager) และการจัดการห้องการแข่งขัน (Contests Management)

---

## 📁 โครงสร้างโฟลเดอร์ของส่วนหน้าบ้าน (Folder Structure)

```text
gradient-frontend/
├── src/
│   ├── assets/                 # ไฟล์ทรัพยากร เช่น โลโก้ และภาพประกอบ
│   ├── components/             # คอมโพเนนต์ UI แยกตามประเภทหน้าการทำงาน
│   │   ├── AdminDashboard.tsx  # หน้าควบคุมหลักของแอดมิน
│   │   ├── ContestForm.tsx     # ฟอร์มเพิ่ม/แก้ไขการแข่งขัน
│   │   ├── ContestList.tsx     # รายการแสดงการแข่งขันทั้งหมด
│   │   ├── GraderConsole.tsx   # คอนโซลแสดงผลลัพธ์การรันและการตรวจ
│   │   ├── Icons.tsx           # คลังเก็บ SVG Icons ที่ใช้บ่อยในระบบ
│   │   ├── Layout.tsx          # ตัวจัดการโครงสร้างหน้า (Header/Navbar/Content)
│   │   ├── Login.tsx           # หน้าจอลงชื่อเข้าใช้งาน
│   │   ├── Modal.tsx           # หน้าต่างลอยแสดงทับ (Popup Modal)
│   │   ├── Navbar.tsx          # แถบนำทางด้านบนระบบ
│   │   ├── ProblemDetail.tsx   # หน้าจอท้าทายโจทย์เขียนโปรแกรมแบบ LeetCode Workspace
│   │   ├── ProblemForm.tsx     # ฟอร์มเพิ่ม/แก้ไขข้อมูลโจทย์
│   │   ├── ProblemList.tsx     # หน้ารายการโจทย์เขียนโปรแกรมหลัก
│   │   ├── Register.tsx        # หน้าสมัครบัญชีผู้ใช้ใหม่
│   │   ├── StatementPanel.tsx  # หน้าจอแสดงผลรายละเอียดคำอธิบายโจทย์
│   │   ├── SubmissionList.tsx  # หน้าประวัติการส่งโค้ดทั้งหมด (Public Submissions)
│   │   ├── SubmissionsHistory.tsx # หน้าประวัติย่อยประสงค์การส่งข้อนั้นๆ
│   │   ├── Table.tsx           # คอมโพเนนต์ตารางข้อมูลทั่วไป
│   │   ├── TestcaseManager.tsx # คอมโพเนนต์จัดการไฟล์ทดสอบคำตอบ
│   │   └── UserProfileModal.tsx # การตั้งค่าส่วนตัวผู้ใช้/ปิดเข้าสู่ระบบ
│   │
│   ├── context/
│   │   └── GradientContext.tsx # Context เก็บสถานะ (User Auth, API Fetch, Theme, CRUD State)
│   │
│   ├── App.css                 # สไตล์ชีตรวมหลักระดับ Application
│   ├── App.tsx                 # คอมโพเนนต์หลักที่ทำหน้าที่จับคู่ Routing
│   ├── index.css               # สไตล์ชีตระบบฐาน (CSS Variables, Modern Tokens, Scrollbars)
│   ├── main.tsx                # จุดเชื่อมเริ่มต้นแอปพลิเคชัน React
│   └── router.tsx              # ตัวจัดการเส้นทาง (React Router) ป้องกัน Private Routes
```

---

## 🛠️ ขั้นตอนการรันและพัฒนา (Setup & Running)

ฝั่งหน้าบ้านแนะนำเป็นอย่างยิ่งให้ใช้งานตัวติดตั้งแพ็กเกจ **Bun** เพื่อความเร็วในการรันและการ Build

### 1. ติดตั้ง Dependencies
เปิด Terminal ในโฟลเดอร์ `gradient-frontend` แล้วเรียกใช้คำสั่ง:
```bash
bun install
```

### 2. รันแอปพลิเคชันฝั่งพัฒนา (Development)
เรียกใช้คำสั่งเพื่อรัน Hot Module Replacement (HMR) ของ Vite:
```bash
bun run dev
```
ระบบจะเปิดพอร์ตการทำงานที่: `http://localhost:5173` โดยตัวระบบจะดึง Endpoint ปลายทางของหลังบ้านไปหา `http://localhost:8080` (หรือสามารถแก้ไขการ Config ได้ที่ `vite.config.ts` หรือการเรียก API ภายในโปรเจกต์)

### 3. ตรวจสอบความถูกต้องและสร้างเวอร์ชันผลิต (Build for Production)
ตรวจสอบประสิทธิภาพและการประมวลผลประเภทตัวแปร TypeScript พร้อมทำ Bundling:
```bash
bun run build
```
ผลลัพธ์ที่นำไป Deploy จะถูกสร้างขึ้นที่โฟลเดอร์ `/dist`

---

## 🎨 การตั้งค่าการออกแบบ (Design Guidelines)

*   **Neutral-First Theme**: สไตล์มินิมอลด้วยสีดำ สีกราไฟต์ สีเทาเข้ม และสีกรมท่า (Slate) ตัดกับความเด่นของ Accent Color เพื่อส่งเสริมสมาธิของนักพัฒนาขณะอ่านโค้ด
*   **Custom Monaco Style**: การเปลี่ยนธีมของ Monaco Editor จะผูกโดยตรงผ่าน `theme` ใน `GradientContext.tsx` โดยจะใช้ `vs-dark` ในธีมมืด และ `light` ในธีมสว่าง
*   **Responsive Layouts**: ทุกปุ่ม คลาส หน้าจอ หรือแม้กระทั่งตาราง มีการออกแบบ Flex และ Grid เพื่อให้พร้อมรันได้ทั้งบนหน้าจอปกติ และสามารถขยายจอเขียนโค้ดได้เต็มที่ที่สุด
