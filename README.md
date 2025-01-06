# SpendSmart

## Project Overview

SpendSmart is a personal finance management tool designed to help users take control of their finances through effective expense tracking, insightful visual analysis, customizable budgets, and goal-setting capabilities.
With SpendSmart, users can easily log their daily expenses and income, categorizing them into groups like groceries, entertainment, and transportation. Categories are flexible and can be customized to fit each user’s unique financial landscape. This granular tracking empowers users to manage their finances with precision. For visual clarity, SpendSmart offers a range of charts tailored for intuitive financial analysis. The platform’s budgeting tools enable users to set monthly or weekly budgets, complete with progress bars and email alerts that signal when they’re close to reaching their limits. SpendSmart also features goal tracking, so users can set personal financial goals and monitor their progress with weekly insights delivered directly through the platform and by email.

:eyes: [Video Demo](https://www.youtube.com/watch?v=hFnwin-n6Uo)

---

## Key Features

1. **Login/Signup**  
   Users can create accounts with a simple username and password for secure access during the beta phase. User can also login using their Google account. **Google OAuth 2.0** will enhance security and convenience, allowing users to log in with their Google accounts.

2. **Manual Expense Tracking and Categorization**  
   Users can manually input expenses and incomes, organize them into predefined or custom categories, and gain full control over their financial organization.

3. **Image and PDF Scanning with OCR**  
   With **OCR (Optical Character Recognition)**, users can upload images of bank statements, and the app will extract and organize expense data automatically, streamlining entry and saving time.

4. **Visual Spending Analysis**  
   SpendSmart provides Donut Graphs for spending distribution across categories.

5. **Customizable Budgeting Tools**  
   Users can set monthly/yearly budgets with real-time tracking, visual progress bars, and real-time notification email alerts when limits are approached.

6. **Goal Tracking and Progress Reports**  
   Set financial goals, monitor progress, and receive detailed weekly or monthly reports directly in-app.

7. **AI-Driven Personalized Recommendations**   
   Using **Google Gemini AI**, the app will analyze spending patterns and offer actionable insights tailored to individual habits.

8. **Transaction Tagging and Notes**  
   Tag transactions with custom labels or add notes for better organization, such as tracking work expenses or gifts.

9. **Mobile-Friendly Design**  
    The app is fully responsive, offering a clean and intuitive experience on both mobile and desktop devices.

10. **Authentication and Security**  
    SpendSmart uses **Google OAuth 2.0** and robust encryption to safeguard user data and ensure secure access.


---

## Development Details

### Code Design

The app uses a **client-server architecture**:
- **Frontend:** Built with **React.js**, featuring modular components like Confirmation Modals and Sidebar for a dynamic user interface.
- **Backend:** Developed in **Node.js** with **Express.js**, focusing on robust server logic and handling API requests.
- **Database:** User data and transactions are stored in **MongoDB**, leveraging its flexibility with JSON-like documents.

### Tools

1. **Frontend:**
   - **React.js** for a responsive and modular UI.
   - **HTML5** and **CSS3** for layout and styling.
   - **Chart.js** for data visualization.

2. **Backend:**
   - **Node.js** and **Express.js** for server-side logic and APIs.
   - **Nodemailer** for email notifications.
   - **Tesseract.js** for Optical Character Recognition (OCR).
   - **Google Gemini AI** for text formatting and personalized insights.
   - **Cron jobs** for automating report generation and scheduled tasks.

3. **Deployment:**
   - Virtual machine hosted on **Google Cloud Platform (GCP)**.
   - **Docker** for containerization of frontend and backend components.
   - **Nginx** as a reverse proxy with HTTPS configured using **Let's Encrypt**.
   - **Domain:** harmonemail.tech with DNS records mapped to the static IP of the GCP VM.


---

## Assumptions and Limitations

1. Budgets cannot be reduced unless a related transaction is deleted or its date is modified.
2. Notifications are sent only when a budget is close to its limit but will stop once the budget exceeds its limit.
3. Custom labels are shared across all books and managed separately for incomes and expenses.
4. OCR supports only images of bank statements.
5. Each email address can only have one account (native or Google login).
6. A default book named "Daily Expenses" is created automatically for every new user and cannot be deleted.

---

## Steps to quickly generate reports:

1. Go to app.mjs in the backend

2. Find and Locate (near line 59): 
    cron.schedule("0 0 * * *", async () => {
        const date = new Date();
        const weekday = date.getDay();
        if (weekday == 1){
            await generateWeeklyReports();
        }
    });

    cron.schedule("0 0 * * *", async () => {
        const date = new Date();
        const day = date.getDate();
        if (day == 1){
            await generateMonthlyReports();
        }
    });

3. replace all 0 to * and you should have:
    cron.schedule("* * * * *", async () => {
        const date = new Date();
        const weekday = date.getDay();
        if (weekday == 1){
            await generateWeeklyReports();
        }
    });

    cron.schedule("* * * * *", async () => {
        const date = new Date();
        const day = date.getDate();
        if (day == 1){
            await generateMonthlyReports();
        }
    });
    
4. change the weekday to the real life weekday (i.e. if its friday then change weekday to 5, beware that sunday's weekday is 0 and not 7):
    cron.schedule("* * * * *", async () => {
        const date = new Date();
        const weekday = date.getDay();
        if (weekday == 5){
            await generateWeeklyReports();
        }
    });

5. change the day to the real life day (i.e. if its December 2nd today then change day to 2):
    cron.schedule("* * * * *", async () => {
        const date = new Date();
        const day = date.getDate();
        if (day == 2){
            await generateMonthlyReports();
        }
    });

6. (optional) add log messages

7. final code should be something like:
    cron.schedule("* * * * *", async () => {
        const date = new Date();
        const weekday = date.getDay();
        if (weekday == 5){
            await generateWeeklyReports();
            console.log("flag1");
        }
    });

    cron.schedule("* * * * *", async () => {
        const date = new Date();
        const day = date.getDate();
        if (day == 2){
            await generateMonthlyReports();
            console.log("flag2");
        }
    });
    
8. run the backend and reports will be generated every minute

## Testing the application.

1. `cd backend`
2. `npm i`
3. `npm run test`

