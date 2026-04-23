# Work Now, Play Now

Work Now, Play Now is a JavaScript-based task tracker designed to increase productivity through motivation and rewards. Built with real-world situations in mind, it helps users stay focused by pairing task completion with rewards. 

## Features
- **Add a Task**: Create new tasks with just a few clicks

- **Delete a Task**: Easily delete a task that you no longer need

- **Streak Builder**: Log in every day to increase streak and unlock achievements

- **Reward System**: Finish tasks to receive rewards to encourage productivity 

- **Calendar Sync**: Easily sync the app to your Google Calendar to have tasks and events all in one place

## Getting Started
> Work Now, Play Now is a web application that can run on any web browser. 
### From Release
-Access the full web application at https://worknowplaynow.com/

### Building From Source Code
1. **Clone the repository:**
   
     git clone https://github.com/Robonics/WorkNowPlayNow/tree/master
     cd worknowplaynow
   
2. **Install Dependencies:**

    npm install
   
3. **Set up Environmental Variable:**
   
   Create the file .env.local int the root of the project:  
   SUPABASE_URL=your_superbase_project_url_here
	SUPABASE_ANON_KEY=your_superbase_anon_key_here

4. **Set up the Database:**
   
   In your Supabase ptoject, run the SQL from database/schema.sql
   
5. **Run the App:**
    
   Use either node index.js or node.
   
7. **(Optional) Google OAuth and Calender Set up:**
   
   To use the Google SIgn-In and Calender integration locally you need to
   - Go to [Google Cloud Console] (https://console.cloud.google.com)
   - Add “https://localhost:8080” to **Authorized JavaScript Origins** on yout OAuth credentials
   - Add “https://localhost:8080” as a test user if the app is still in testing mode.


