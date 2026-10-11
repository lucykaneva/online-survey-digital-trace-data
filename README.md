<h1 align="center">Online Survey Digital Trace Data</h1>
<div id="top"></div>

<p align="left">

Welcome to the code repository for "Untapped Potential: Designed Digital Trace Data in Online Survey Experiments!" We created this repository to show you how we implemented the studies described in our paper, which collected digital trace data through interactive digital resumes embedded in Qualtrics surveys. Here we provide instructions for how you can recreate these digital resumes. You can also adapt this code for your own research! If you use this repository, we ask that you please cite us. Suggested citation:

> Macke, Erin, Claire Daviss, and Emma Williams-Baron. 2024. “Untapped Potential: Designed Digital Trace Data in Online Survey Experiments.” _Sociological Methods & Research_. doi: 10.1177/00491241241268770.

All authors contributed equally to this work. Name order was chosen at random.

Demo: [https://cdaviss.github.io/online-survey-digital-trace-data/#/](https://cdaviss.github.io/online-survey-digital-trace-data/#/)

### Abstract

Researchers have developed many uses for digital trace data, yet most online survey experiments continue to rely on attitudinal rather than behavioral measures. We argue that researchers can collect digital trace data during online survey experiments with relative ease, at modest costs, and to substantial benefit. Because digital trace data unobtrusively measure survey participants’ behaviors, they can be used to analyze digital outcomes of theoretical and empirical interest, while reducing the risk of social desirability bias. We demonstrate the feasibility and utility of collecting digital trace data during online survey experiments through two original studies. In both, participants evaluated interactive digital resumes designed to track participants’ clicks, mouse movements, and time spent on the resumes. This novel approach allowed us to better understand participants’ search for information and cognitive processing in hiring decisions. There is immense, untapped potential value in collecting digital trace data during online survey experiments and using it to address important sociological research questions.
</p>

## Table of Contents

- [Usage](#usage)
- [Creating Interactive Digital Resumes for Qualtrics Surveys](#creating_interactive_digital_resumes)
- [Troubleshooting](#troubleshooting)
- [Customizing](#customizing)
- [Admin login](#admin_password)
- [Contributing](#contributing)
- [Acknowledgements](#acknowledgements)
- [Replicating Results](#replicating_results)

## Usage <a name="usage"></a>

The interactive digital resumes created using this code are designed to be hosted on GitHub Pages. To see an example of how these interactive digital resumes may look embedded into a web page, click [here](https://cdaviss.github.io/online-survey-digital-trace-data/#/).

Once you create the different resume pages, you can embed them individually into Qualtrics surveys. Digital trace data collected from the resumes are stored in Firebase. Then, you can download your data from an "admin" page, one of the web pages this repository creates.

<p align="right">(<a href="#top">back to top</a>)</p>

## Creating Interactive Digital Resumes for Qualtrics Surveys <a name="creating_interactive_digital_resumes"></a>

Here we explain how to create interactive digital resumes, embed them into a Qualtrics survey, and download the digital trace data they collect. These instructions assume some basic knowledge of using Github, terminal, and Qualtrics. If you are unfamiliar with these tools, we encourage you to read up before getting started. There are is a seemingly infinite number of great introductory resources available online!

### Prerequisites

Before you get started, you'll need to copy the code to your own computer and install dependencies. Please note: This has only been tested in MacOS. 

1. [Set up Git and GitHub](https://docs.github.com/en/get-started/quickstart/set-up-git).

2. [Fork this repository](https://docs.github.com/en/get-started/quickstart/fork-a-repo) to create your own copy of this repository.

3. [Clone your fork](https://docs.github.com/en/get-started/quickstart/fork-a-repo#cloning-your-forked-repository) of the code to get the files on your local computer.

4. [Install npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) (Node Package Manager), which you will use to run the code. This code was developed with npm v9.2.0 and Node.js v16.18.1.

<p align="right">(<a href="#top">back to top</a>)</p>

### Set Up Firebase

Firebase will serve as the database for your project. You use Firebase to enter the information that will go into the resumes (e.g., work, education, and miscellaneous information). The interactive digital resumes "read" this resume information directly from Firebase. Then, once the interactive digital resumes are created, digital trace data will also be "write" to Firebase.

1. [Create a Firebase project and register your app](https://firebase.google.com/docs/web/setup#create-firebase-project-and-app).

    Most of the steps in the Firebase instructions are self-explanatory, so follow along! When presented with the choice to enable Google Analytics, please do so. Finally, on the last registration page, you'll see a bunch of information, including your API key, authorization domain, project ID, etc. You may want to copy this information into a separate document, as you'll need it later.

2. Build the database of resume information.

    Navigate to your Firebase Console. From the "Build" drop-down menu on the left, select "Firestore Database." Click "Create Database." In the options you will select the location and the "secure rules." You can click "start in production mode." 

   A general overview: when creating the database, you'll be creating "collections." Within each collection, you can add "documents" and within documents, you can add fields of various types. You will be creating two collections (one for `candidates` and one for `resume`). E.g., in the format shown below, `education a` is a document, and `degree` would be a field.
   
   Start by selecting "+ Start Collection" and name the collection ID `candidates` and choose "next." You will then be prompted to add a document ID, you could call this candidate a, for example. Within the `candidates` collection, you can create as many candidates as you want. Each candidate must have two fields: `isMan` (of type boolean) and `name` (of type string). The `isMan` field is used to determine pronouns shown in the resume. Set the values equal to the desired gender and name for each candidate. 

   The second type of collection is `resume.` this will contain all resume information. Under document ID, you enter each of the headers (e.g., `education a`, `education b`, `work box 1a`, and so on). Then, in the "fields", you enter the subheaders (e.g., `degree`, `duration`, `major`, and `university`). Each field should be of type "string." Within the values for `notes from initial phone screen` and `misc`, you can insert gendered words by including the options in square brackets. For example, `[his/her] spouse` would become `"his spouse"` or `"her spouse"`. The first option will be inserted for men candidates, and the second for women.

    Your database should have this format:

    ```text
    | resume
    | ---- education a
    | ---- ---- degree
    | ---- ---- duration
    | ---- ---- major
    | ---- ---- university
    | ---- education b
    | ---- ---- degree
    | ---- ---- duration
    | ---- ---- major
    | ---- ---- university
    | ---- misc
    | ---- ---- nonparent
    | ---- ---- parent
    | ---- notes from initial phone screen 
    | ---- ---- nonparent
    | ---- ---- parent
    | ---- work box 1a
    | ---- ---- company
    | ---- ---- description
    | ---- ---- duration
    | ---- ---- location
    | ---- ---- title
    | ---- work box 1b
    | ---- ---- company
    | ---- ---- description
    | ---- ---- duration
    | ---- ---- location
    | ---- ---- title
    | ---- work box 2a
    | ---- ---- company
    | ---- ---- description
    | ---- ---- duration
    | ---- ---- location
    | ---- ---- title
    | ---- work box 2b
    | ---- ---- company
    | ---- ---- description
    | ---- ---- duration
    | ---- ---- location
    | ---- ---- title
    | candidates
    ```

3. Set up rules.

    Firebase rules define who is allowed to "read" the data you enter into Firebase (i.e., to request that Firebase fill that data into the digital resumes) and "write" to your database (i.e., save any digital trace data that get created with the digital resumes). We want the website to be able to read and write all data, so we'll set those rules. From your Firebase console, on the "Firestore Database" page with the header "Cloud Firestore," click the "Rules" tab at the top of the page. Copy and paste the following rules to that page:

    ```json
    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {
        match /{document=**} {
          allow read;
          allow write: if true
        }
      }
    }
    ```

<p align="right">(<a href="#top">back to top</a>)</p>

### Installation

In this next step, you'll use the repository that is now stored on your local computer to create the interactive digital trace resumes.

1. In terminal, navigate to the directory containing the code.

    ```sh
    cd online-survey-digital-trace-data
    ```

2. Install NPM packages by entering into terminal:

    ```sh
    npm install
    ```

    You might get scary-looking warnings here. This is fine! _(Technical explanation of why these warnings happen [here](https://overreacted.io/npm-audit-broken-by-design/).)_

3. Add your Firebase API keys and create your Admin password.

    Open the file in your repository called `config_sample.js`, under the folder `src`. (Hint: These are javascript files! They can be edited in any plain text editing softwares, such as TextEdit on MacOS.)

    When you created your Firebase and registered your app (Step 1 under Setup Firebase), you were given information about your API and more. Copy this information into this javascript file. It should be obvious where it goes -- we've left placeholders! Also, as a reminder: **this file contains things that should be kept secret!** Anyone who has your API key has total control over all of your data.

    When you are testing and playing around with the site, you probably want to leave `IS_DEMO_VERSION` set to `True`. This turns off the data recording (to save you money) and speeds up the Admin page. When you are ready to launch your study, set `IS_DEMO_VERSION` to `False`.

   When you are done making these changes, rename this file to `config.js` and save it in the `src` folder.

4. Start serving the code.

    This step will run all of the files in the repository necessary to create a local version of the "demo" shown above. The demo will present versions of the interactive digital resumes in a new tab in your web browser. The URL will start with `localhost:`. This is because it is _not_ online yet -- it's still on your computer! This gives you the opportunity to make changes before you push the final version of the interactive digital resumes to their online format. To serve the code, enter in terminal:

    ```sh
    npm start
    ```

    In the future, if you want to make changes to your interactive digital resumes, you can start with this step.

5. To close the website, enter `Ctrl+C` in the terminal.

<p align="right">(<a href="#top">back to top</a>)</p>

### Deploying

This step is where we create the web URLs that host the interactive digital resumes. These pages are public, so you can embed them in Qualtrics surveys (the next step). Here we create the resume pages using GitHub Pages, which offers free web hosting for your projects, as of this writing.

1. In your repository, open the `package.json` file (hint: you can use a plain text editor), and ensure that the correct homepage URL is at the top:

    ```json
    {
      "name": "digital-trace-data",
      "homepage": "https://YOUR_GITHUB_USERNAME.github.io/YOUR_REPOSITORY_NAME/",
      "version": "0.1.0",
      // more stuff that you can leave as-is...
    ```

2. Deploy the website to [GitHub Pages](https://pages.github.com/) by entering into terminal:

    ```sh
    npm run deploy
    ```

<p align="right">(<a href="#top">back to top</a>)</p>

Et voila! Your pages have been created. You can explore the pages by going directly to the resume URLs. Just fill in the relevant study version, resume version, and a "response ID" (can be any letter/number combination) into this URL: <https://YOUR_GITHUB_USERNAME.github.io/YOUR_REPOSITORY_NAME/#/NUMBER/NUMBER/QUALTRICS_RESPONSE_ID>.

### Use in Qualtrics

The next step is to embed the interactive digital resumes into a Qualtrics survey.

1. Create a new survey.

    Navigate to Qualtrics ([qualtrics.com](https://qualtrics.com)), and once logged in, click "Create a project." Create a survey "from scratch."

2. Create embedded fields.

    You can randomly assign participants into conditions in Qualtrics surveys. To do so, navigate to "Survey flow" via the button in the left-hand menu. Click "Add a New Element Here." Under "What do you want to add?", click "Embedded Data." Create a new field called `studyVersion`. This is the first number that will appear in the URL that calls the interactive digital resume. Then create another new field called `resumeVersion`. This is the second number that gets incorporated into the interactive digital resume URL. You do NOT need to create a field for `ResponseId` -- Qualtrics does this automatically when a participant enters the survey!

3. Create a "Text/Graphic" question.

    Go back to the survey builder by clicking the "Builder" button in the left-hand menu. Qualtrics likely automatically created a multiple choice question for you on the blank project. You can change that to a "Text/Graphic" question using the drop down option menu under "Question type" on the left.

4. Embed the interactive digital resume into the "Text/Graphic" question.

    Click into the text box under the Text/Graphic question. Click "Rich Content Editor...". Look for the box with "<>" inside it at the top of this field; this changes the formatting style to HTML code. Then, enter the following into the box:

    > `<iframe width="600px" height="1000px" src="https://YOUR_GITHUB_USERNAME.github.io/YOUR_REPOSITORY_NAME/#/${e://Field/studyVersion}/${e://Field/resumeVersion}/${e://Field/ResponseID}"></iframe>`

    This will embed the digital resume into your Qualtrics survey.

    Hint: You'll want to keep track of the iframe width and height if you're using mouse tracking. This ensures that the meaning of "x" and "y" mouse coordinates mean the same thing for all participants.

<p align="right">(<a href="#top">back to top</a>)</p>

## Troubleshooting <a name="troubleshooting"></a>

If you are encountering problems with the website, we recommend you follow these steps:

1. Try the entire process again, double checking that you are following the instructions exactly as written, and filling in any placeholders with your own values.
2. Read the error message. If you can't understand it, copy-paste the message into Google, and look for others who have run into the same error in other projects.
3. Look at [previous issues](https://github.com/cdaviss/online-survey-digital-trace-data/issues?q=is%3Aissue+) in this repository to see if anyone else has run into (and resolved) the issue.
4. [Open an issue](https://docs.github.com/en/issues/tracking-your-work-with-issues/creating-an-issue) and provide as much information as you can. Explain what you’re trying to do and include the entire output of your terminal and [browser console](https://appuals.com/open-browser-console/), including any error messages.

Please _do not_ email the authors with troubleshooting questions. Our former RA, Steven Opferman, has kindly offered to field questions... but he has every right to ignore you if you ask for too much! He's got a life, okay??

<p align="right">(<a href="#top">back to top</a>)</p>

## Customizing <a name="customizing"></a>

There are many ways you can adapt the interactive digital resumes created here for use in your own studies! Here are a few ideas:

1. The simplest adaptation is to change the information shown in the already created fields for work, education, and miscellaneous items. All you need to do here is change that information in Firebase, so minimal coding skills required.
2. Another thing you might want to do is run multiple variations of the study. For example, you might want to add a remote/collocated random assignment in addition to the parent/nonparent condition. You can use the `studyVersion` parameter in the URL to route to different variants of the study, which should have their logic implemented within `Resume.js` in the `getResume1Values` function.

<p align="right">(<a href="#top">back to top</a>)</p>

## Admin login by Lyudmila Kaneva October 2026<a name="admin_password"></a>
To log in and download your survey data from the admin page, you are prompted to enter an email and password. The authentication process happens through Firebase itself and thus, we are storing the email and password there rather than in config.js as before. 

To add an admin email and password:
1. Navigate to your Firebase Console, open your database project under Projects. 
2. On the sidebar to the left, under Project Shortcuts, choose **Authentication**. 
3. Click on **Sign-in method** in the top bar -> **Add new provider** and enable the Email/password option. 
4. Click on **Users** from the top bar ->  **Add user** and add an email and a password. Save the information by clicking **Add user**. 
5. Navigate to your Admin page (/#/admin) and sign in with that email and password.

<p align="right">(<a href="#top">back to top</a>)</p>

## Contributing <a name="contributing"></a>

Collaboration is what makes the world such an amazing place to learn, inspire, and create. We greatly appreciate any contributions or suggestions!

Feel free to do any of the following:

- [open an issue](https://docs.github.com/en/issues/tracking-your-work-with-issues/creating-an-issue) with the tag "enhancement"
- [fork the repo](https://docs.github.com/en/get-started/quickstart/fork-a-repo) and [create a pull request](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request)
- send Steven, who helped to create this repository, an [email](mailto:steven.g.opferman@gmail.com)

<p align="right">(<a href="#top">back to top</a>)</p>

## Acknowledgements <a name="acknowledgements"></a>

This code was originally developed by [Neha Sharma](https://github.com/sharman99) in 2021. The codebase was updated by [Steven Opferman](https://thefirstquestion.github.io/), who also wrote the documentation in collaboration with Erin Macke, Claire Daviss, and Emma Williams-Baron in 2023. We -- Erin, Claire, and Emma -- are sincerely grateful to Neha and Steven for their incredible research assistance throughout this project!

<p align="right">(<a href="#top">back to top</a>)</p>

## Data and Code Packages for Replicating Results in the "Untapped Potential" Paper <a name="replicating_results"></a>
In addition to sharing the JavaScript/CSS/HTML code for implementing digital trace data in this repository, we also share the Stata/R code and data for replicating the results in the "Untapped Potential" paper. You can find that repository here: https://github.com/EmmaWB/Untapped-Potential-Replication-Package
