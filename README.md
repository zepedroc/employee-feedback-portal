# Employee Feedback Reporting System
  
This is a project built with [Chef](https://chef.convex.dev) using [Convex](https://convex.dev) as its backend.
  
## Technology Choices

### Why Convex?

Convex was chosen for this project for two main reasons:

1. **Chef Tool**: This project was jumpstarted using [Chef](https://chef.convex.dev/), a vibe coding tool that helps generate realtime full-stack apps with Convex. Chef provides a streamlined way to bootstrap Convex projects with best practices.
2. **Unified Project Structure**: Having both backend and frontend code in the same project makes it significantly easier for AI coding assistants to understand the full context of the application, leading to better code suggestions and more effective pair programming.

### Why shadcn/ui?

[shadcn/ui](https://ui.shadcn.com/) was selected as the component library because it follows a copy-paste component model (rather than being a traditional npm dependency), is built on accessible [Radix UI](https://www.radix-ui.com/) primitives, and provides full customization through Tailwind CSS. This approach gives us complete control over the components while maintaining accessibility standards and modern design patterns.

## Project structure
  
The frontend code is in the `src` directory and is built with [Vite](https://vitejs.dev/).
  
The backend code is in the `convex` directory.
  
`npm run dev` will start the frontend and backend servers.

Make sure to run `npm install` to install the dependencies before running the project.

## App authentication

Chef apps use [Convex Auth](https://auth.convex.dev/).

## Email System

This application uses [Brevo](https://www.brevo.com/) for sending email notifications. The system sends emails for:
- Manager invitations when a new manager is invited to a company
- Report notifications when a new report is submitted

**Note**: Emails will probably go to the spam folder. This is expected behavior, especially when using personal email addresses as the sender (as in the case of this project). Recipients should check their spam/junk folder for emails from this system.

