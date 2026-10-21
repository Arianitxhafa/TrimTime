# 💈 TrimTime

**A modern mobile appointment management app for barbershops.**

TrimTime is a mobile application project built with **React Native, Expo, and TypeScript**. Its goal is to simplify appointment management for barbershops through a clean, intuitive, and user-friendly mobile experience.

The project is being developed as part of a university Mobile Applications course, with an emphasis on reusable components, type safety, interactive interfaces, and collaborative software development.

---

## ✨ Current Features

- **Appointment Cards** — Display client names, requested services, appointment times, and statuses.
- **Appointment Statuses** — Support for `Pending`, `Confirmed`, and `Completed` appointment states.
- **Interactive Confirmation** — Confirm pending appointments directly from the interface.
- **Reusable Components** — Appointment information is rendered using a reusable, typed React Native component.
- **Type Safety** — TypeScript helps identify invalid values and prevent common development errors.
- **Expo Go Support** — Run and test the application on a physical mobile device during development.

> **Development status:** TrimTime is currently an early-stage prototype. Appointment information uses sample data, and status changes are managed locally in the component state. Database persistence, authentication, and backend integration are not yet implemented.

---

## 🛠️ Tech Stack

| Technology                                                | Purpose                                    |
| --------------------------------------------------------- | ------------------------------------------ |
| [React Native](https://reactnative.dev/)                  | Cross-platform mobile development          |
| [Expo](https://expo.dev/)                                 | Mobile development and testing workflow    |
| [TypeScript](https://www.typescriptlang.org/)             | Static typing and safer code               |
| [Expo Router](https://docs.expo.dev/router/introduction/) | Application navigation                     |
| [Git](https://git-scm.com/)                               | Version control                            |
| [GitHub](https://github.com/)                             | Source code hosting and team collaboration |
| [Expo Go](https://expo.dev/go)                            | Testing on a physical device               |

---

## 📱 Getting Started

Follow these steps to run TrimTime locally.

### Prerequisites

Make sure you have installed:

- [Node.js](https://nodejs.org/)
- [Git](https://git-scm.com/)
- [Visual Studio Code](https://code.visualstudio.com/)
- [Expo Go](https://expo.dev/go) on your mobile device

### 1. Clone the Repository

```
git clone https://github.com/Arianitxhafa/projekti-im.git
```

### 2. Navigate to the Project

```
cd projekti-im
```

### 3. Install Dependencies

```
npm install
```

### 4. Start the Development Server

```
npx expo start
```

### 5. Open the App on Your Phone

1. Open Expo Go on your phone.
2. Scan the QR code displayed by the Expo development server.
3. Wait for TrimTime to load.

For the simplest setup, connect your phone and computer to the same Wi-Fi network.

If the connection does not work, try:

```
npx expo start --tunnel
```

---

## 📂 Project Structure

```
projekti-im/
├── src/
│   ├── app/
│   │   ├── _layout.tsx
│   │   └── index.tsx
│   └── components/
│       └── KartaTerminit.tsx
├── IDETE.md
├── package.json
└── README.md
```

**Key files**

- `src/app/index.tsx` — Main screen displaying the TrimTime interface and sample appointments.
- `src/app/_layout.tsx` — Root navigation layout.
- `src/components/KartaTerminit.tsx` — Reusable appointment card component, including appointment details and confirmation interaction.
- `IDETE.md` — Project ideas and documentation of selected development decisions.

---

## 🧩 Component Design

The appointment card is implemented as a reusable component with typed properties.

Each appointment includes:

- `klienti` — Client name.
- `sherbimi` — Requested service.
- `ora` — Appointment time.
- `statusi` — Appointment status.

The status is restricted to three permitted values:

```
type StatusiTerminit =
  | "Në pritje"
  | "Konfirmuar"
  | "Përfunduar";
```

This approach demonstrates how TypeScript union types can restrict accepted values and improve component reliability.

---

## 🗺️ Development Roadmap

The following features are potential future improvements and are not yet implemented.

- Professional UI and improved user experience
- Barber profiles and service catalog
- Appointment booking flow
- Date and time selection
- Persistent appointment storage
- Backend and database integration
- User authentication and role-based access
- Appointment editing and cancellation
- Push notifications and appointment reminders
- Business dashboard for barbershop owners

---

## 🤝 Team Collaboration

TrimTime is developed collaboratively using Git and GitHub.

### Recommended Workflow

Before starting work:

```
git pull
```

After making changes:

```
git add .
git commit -m "Describe your changes"
git push
```

**Team guidelines**

- Pull the latest changes before starting a task.
- Use clear and descriptive commit messages.
- Test changes before pushing them.
- Coordinate work to reduce merge conflicts.
- Never commit passwords, API keys, or other secrets.

---

## 🎓 Project Purpose

This project provides practical experience with:

- Cross-platform mobile application development
- React Native components and state management
- TypeScript and type-safe programming
- Expo development workflows
- Git and GitHub collaboration
- Incremental development and debugging

---

## 👨‍💻 Project Information

- **Project:** TrimTime
- **Category:** Mobile Application
- **Platform:** Android and iOS through Expo-compatible development workflows
- **Language:** TypeScript
- **Repository:** [Arianitxhafa/projekti-im](https://github.com/Arianitxhafa/projekti-im)
- **Status:** In development

---

_TrimTime — Making barbershop appointment management simpler, one appointment at a time._ 💈
