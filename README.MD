

# Contact Management System

A full-stack contact management application built with Angular and Node.js, featuring real-time contact locking and comprehensive CRUD operations.

## Features

- **User Authentication**: JWT-based authentication with role-based access control
- **Contact Management**: Full CRUD operations for managing contacts
- **Real-time Updates**: Socket.io integration for contact locking during editing
- **Search & Filter**: Advanced search and filtering capabilities
- **Pagination**: Server-side pagination for efficient data handling
- **Responsive Design**: Modern, mobile-friendly interface

## Tech Stack

### Frontend
- Angular 18
- Angular Material
- TypeScript
- Socket.io Client
- RxJS

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- Socket.io
- JWT Authentication
- Joi Validation

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/mahmoudadel810/Contact-management--System.git
cd Contact-Managment
```

2. Install server dependencies
```bash
cd Server
npm install
```

3. Install client dependencies
```bash
cd ../Client/contact-manager-client
npm install
```


### Running the Application

1. Start the backend server
```bash
cd Server
npm start
```

2. Start the Angular development server
```bash
cd Client/contact-manager-client
ng serve
```

3. Open your browser and navigate to `http://localhost:4200`

## Default Users

- **Admin User**: username: `user1`, password: `user1`
- **Regular User**: username: `user2`, password: `user2`

## API Endpoints

- `POST /api/v1/users/login` - User authentication
- `GET /api/v1/contacts/getContacts` - Get contacts with pagination
- `POST /api/v1/contacts/addContact` - Create new contact
- `PUT /api/v1/contacts/updateContact/:id` - Update contact
- `DELETE /api/v1/contacts/deleteContact/:id` - Delete contact
- `GET /api/v1/contacts/getContact/:id` - Get single contact



## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.
