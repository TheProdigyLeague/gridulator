# Gridulator

Gridulator is a web-based 3D application that provides a simple, interactive grid environment. It features a first-person perspective, allowing users to navigate and interact with the 3D space.

## Technologies Used

### Backend: Python & Flask

The backend is built using **Flask**, a lightweight and flexible web framework for Python.

**What is Flask?**
Flask is a micro web framework written in Python. It is classified as a "microframework" because it does not require particular tools or libraries. It has no database abstraction layer, form validation, or any other components where pre-existing third-party libraries provide common functions. However, Flask supports extensions that can add application features as if they were implemented in Flask itself. In this project, Flask is used to serve the main `index.html` page and all the necessary static assets (like JavaScript and CSS) to the user's browser.

### Frontend: JavaScript & Three.js

The frontend is responsible for rendering the 3D world and handling user interaction. It is built with vanilla JavaScript and the powerful **Three.js** library.

**Synopsis of JavaScript Technologies:**
*   **Vanilla JavaScript:** The core logic for user controls (movement, camera, commands) and DOM manipulation is written in plain, standard JavaScript without the use of larger frameworks like React, Angular, or Vue.
*   **Three.js:** This is a cross-browser JavaScript library and application programming interface (API) used to create and display animated 3D computer graphics in a web browser. In Gridulator, Three.js is used for everything related to the 3D environment, including:
    *   Setting up the scene, camera, and renderer.
    *   Creating the grid, lighting, and 3D objects (cubes).
    *   Managing the first-person camera and player movement within the 3D space.
