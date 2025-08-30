# NextJS Quiz App with Virtual Teachers

## Overview

This NextJS Quiz App offers an engaging learning experience with virtual teachers that guide users through various quizzes. The application features:

- Customizable virtual teachers with text-to-speech capabilities
- Multiple expression images for teachers that change based on user interactions
- Personalized user profiles with progress tracking
- Question categorization and favoriting system
- Flexible quiz organization with nested categories

## Table of Contents

- [Getting Started](#getting-started)
- [Application Structure](#application-structure)
- [Features](#features)
  - [Virtual Teachers](#virtual-teachers)
  - [Quiz System](#quiz-system)
  - [User Profiles](#user-profiles)
- [Configuration Files](#configuration-files)
  - [Teacher Files](#teacher-files)
  - [Question Files](#question-files)
  - [User Preference Files](#user-preference-files)
- [Customization](#customization)
- [Development](#development)

## Getting Started

### Prerequisites

- Node.js 14.x or higher
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/nextjs-quiz-app.git
   cd nextjs-quiz-app
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Application Structure

```
nextjs-quiz-app/
├── pages/
│   ├── index.js                 # Homepage
│   ├── quiz/[...path].js        # Dynamic quiz page
│   └── profile/[username].js    # User profile page
├── components/
│   ├── TeacherAvatar.js         # Teacher avatar component
│   ├── QuizQuestion.js          # Question display component
│   └── ...
├── public/
│   └── teachers/                # Teacher images
│       ├── teacher1/
│       │   ├── neutral.jpg
│       │   ├── happy.jpg
│       │   └── ...
│       └── ...
├── teachers/                    # Teacher configuration files
│   ├── default.teacher
│   ├── professional.teacher
│   └── ...
├── quizzes/                     # Quiz questions organized by topic
│   ├── 000_introduction/
│   │   ├── 000_outline/
│   │   │   ├── 000.question
│   │   │   └── 001.question
│   │   └── ...
│   └── 001_algorithms/
│       └── ...
└── userprefs/                   # User preference files
    ├── Username.config
    └── ...
```

## Features

### Virtual Teachers

The app features virtual teachers with unique personalities and teaching styles:

- Each teacher has a set of expression images for various situations
- Text-to-speech functionality using either Web API or OpenAI's TTS
- Teachers can be randomly assigned or selected by user preference

Key teacher interactions:
- Reading questions aloud
- Providing feedback on correct/incorrect answers
- Offering encouragement and explanations

### Quiz System

- Organized quizzes with nested categories for complex topics
- Multiple question types (single select, multi-select)
- Detailed feedback for both correct and incorrect answers
- Progress tracking and success rate metrics

### User Profiles

- Personalized user profiles with customizable settings
- Question favoriting system with default categories:
  1. ❤️️ Liked
  2. ☠️ Difficult
- Detailed statistics on question attempts and success rates
- Teacher preference settings

## Configuration Files

### Teacher Files

Teachers are defined in `.teacher` files within the `teachers` directory. Example:

```json
{
    "name": "Teacher",
    "gender": "male",
    "background": "No experience.",
    "personality": "More encouragement and relaxed teaching style.",
    "ttsEngine":{
        "baseUrl": null,
        "token": null,
        "model": null,
        "voiceName": null
    },
    "images":{
        "neutral": "neutral.jpg",
        "happy": "happy.jpg",
        "sad": "sad.jpg",
        "angry": "angry.jpg",
        "worried": "worried.jpg",
        "excited": "excited.jpg",
    }
}
```

- If `ttsEngine.baseUrl` is null, the Web API for voices will be used
- Custom TTS can be configured by providing values for OpenAI or other TTS services
- Each teacher has multiple expression images used during different interactions

### Question Files

Questions are stored in `.question` files within the `quizzes` directory structure. Example:

```json
{
    "question": "A node of a heap considered with all of its descendants is also a heap.",
    "question_images": [],
    "choices": [
        "True",
        "False"
    ],
    "choice_images": [
        null,
        null
    ],
    "notes": [
        "",
        "Seems like all descendants of heaps are also heaps, even if there are leaves."
    ],
    "note_images": [
        null,
        null
    ],
    "answers": [
        "True"
    ]
}
```

- `question`: The question text
- `choices`: Array of possible answers
- `notes`: Feedback for each choice (shown when selected)
- `answers`: Array of correct answers (allows multiple for multi-select questions)

### User Preference Files

User preferences are stored in `.config` files within the `userprefs` directory. Example:

```json
{
    "username": "Username",
    "image": null,
    "teacher": "",
    "favorites": {
        "❤️️ Liked": [
            "000_introduction/000_outline/000"
        ],
        "☠️ Difficult": [
            "000_introduction/000_outline/001"
        ]
    },
    "records": {
        "000_introduction/000_outline/000": {
            "attempts": 38,
            "pass": 36,
            "lastAttempted": 1756520340
        },
        "000_introduction/000_outline/001": {
            "attempts": 38,
            "pass": 36,
            "lastAttempted": 1756523340
        }
    }
}
```

- `username`: User's display name
- `image`: Optional user avatar image
- `teacher`: Preferred teacher (empty string for random)
- `favorites`: Questions categorized by user-defined labels
- `records`: Performance tracking for each attempted question

## Customization

### Adding New Teachers

1. Create a new `.teacher` file in the `teachers` directory
2. Add required teacher images in the `public/teachers/[teachername]/` directory
3. Configure the TTS settings as needed

### Creating New Quizzes

1. Create a new directory in the `quizzes` folder (e.g., `002_data_structures`)
2. Add subdirectories for topics if needed
3. Create `.question` files for each quiz question

### Extending Favorite Categories

Users can define their own favorite categories beyond the default "❤️️ Liked" and "☠️ Difficult" through the user interface.

## Development

### Local Storage

The app uses local storage to maintain the current user profile:

```javascript
// Default value in local storage
{
    "defaultUserPref": null
}
```

When a user creates or selects a profile, the `defaultUserPref` value is updated to that profile name.

### TTS Implementation

The app supports two TTS options:
1. Web Speech API (default) - Uses the browser's built-in TTS capabilities
2. OpenAI TTS API - Uses models like "tts-1" with voices such as "alloy"

To implement a custom TTS provider, configure the `ttsEngine` object in the teacher file with the appropriate values.

## API Routes

The application provides several API endpoints to fetch and manage teachers, quizzes, and user preferences:

### Teachers API

```
GET /api/teachers
```
Fetches all available teachers.

```
GET /api/teachers/[name]
```
Fetches a specific teacher by name.

### Quizzes API

```
GET /api/quizzes
```
Fetches the full quiz structure (categories and subcategories).

```
GET /api/quizzes/[...path]
```
Fetches a specific quiz or category by path.
Example: `/api/quizzes/000_introduction/000_outline`

```
GET /api/questions/[...path]
```
Fetches a specific question by path.
Example: `/api/questions/000_introduction/000_outline/000`

### User Preferences API

```
GET /api/userprefs
```
Fetches all user profiles.

```
GET /api/userprefs/[username]
```
Fetches a specific user profile.

```
POST /api/userprefs
```
Creates a new user profile.
Request body:
```json
{
  "username": "NewUser"
}
```

```
PUT /api/userprefs/[username]
```
Updates a user profile.
Request body example:
```json
{
  "teacher": "Teacher",
  "favorites": {
    "❤️️ Liked": ["000_introduction/000_outline/000"]
  }
}
```

```
PUT /api/userprefs/[username]/record
```
Updates a user's question record.
Request body:
```json
{
  "questionPath": "000_introduction/000_outline/000",
  "correct": true
}
```

```
PUT /api/userprefs/[username]/favorite
```
Adds or removes a question from favorites.
Request body:
```json
{
  "questionPath": "000_introduction/000_outline/000",
  "category": "❤️️ Liked",
  "action": "add" // or "remove"
}
```

### Text-to-Speech API

```
POST /api/tts
```
Converts text to speech using the specified engine.
Request body:
```json
{
  "text": "Hello world",
  "teacherName": "Teacher" // Optional, uses default if not provided
}
```
Returns audio data or a URL to the generated audio.

## Application Structure Update

Add these files to the application structure:

```
nextjs-quiz-app/
├── app/
│   ├── api/
│   │   ├── teachers/
│   │   │   ├── route.ts
│   │   │   └── [name]/
│   │   │       └── route.ts
│   │   ├── quizzes/
│   │   │   ├── route.ts
│   │   │   └── [...path]/
│   │   │       └── route.ts
│   │   ├── questions/
│   │   │   └── [...path]/
│   │   │       └── route.ts
│   │   └── userprefs/
│   │       ├── route.ts
│   │       └── [username]/
│   │           ├── route.ts
│   │           ├── record/
│   │           |   └── route.ts
│   │           └── favorite/
│   │               └── route.ts
│   │
│   └── ...
└── ...
```

These API routes provide a clean interface for the frontend to interact with the application's data sources, enabling seamless updates to the UI when changes occur in the underlying data.

This project is designed to be easily extensible for various educational contexts. Feel free to contribute or customize to suit your specific learning needs!
