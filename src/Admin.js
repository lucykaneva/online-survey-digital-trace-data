import React from "react";
import "./App.css";
import firebase from "./firebase";
import Papa from "papaparse";
import ModalReact from "react-modal";
import { IS_DEMO_VERSION } from "./config";
import "bootstrap/dist/css/bootstrap.min.css";
import { getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";
class Admin extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			showErrorMessage: false,
			isAuthenticated: false,
			email: "",
			password: "",
			userIDs: [],
			resumeCSVurl: null,
			activitiesCSVurl: null,
			loggedInAs: "",
			errorMessage: ""
		};

		this.DATABASE = firebase.firestore();

		this.resumeContent = [];
		this.activityContent = [];
		this.auth = getAuth();
		// Ensures screen readers don't see the content while the modal is open
		const rootElement = document.getElementById("root");
		ModalReact.setAppElement(rootElement);
	}

	/** Handles typing in email box */
	handleChangeEmail(event) {
		this.setState({ email: event.target.value })
	}

	/** Handles typing in password box*/
	handleChangePassword(event) {
		this.setState({ password: event.target.value });
	}

	/** Logout handler */
	handleLogout = async () => {
		await signOut(this.auth);
		this.setState({
			email: "",
			password: "", showErrorMessage: false, errorMessage:"", isAuthenticated: false, resumeCSVurl: null,
			activitiesCSVurl: null
		});
	}

	/** Authentication handler */
	handleAdminLogin = async () => {
		try {
			const userCredential = await signInWithEmailAndPassword(this.auth, this.state.email, this.state.password);
			this.setState({ loggedInAs: userCredential.user.email });
			this.setState({ showErrorMessage: false, errorMessage:"", isAuthenticated: true });
			await this.fetchData();
		} catch (error) {
			this.setState({ showErrorMessage: true, isAuthenticated: false, errorMessage: "Login failed. Invalid password or email." });
			console.error("Login failed:", error.message);
		}
	}

	/** Main function that kick-starts all the downloading */
	async fetchData() {
		let userIDs = null;
		this.resumeContent = []
		this.activityContent = []
		// In the demo version, only use the sample response IDs
		if (IS_DEMO_VERSION) {
			userIDs = ["0sampleResponseIDstudy1", "0sampleResponseIDstudy2"];
		} else {
			try {
				const tmp = await this.DATABASE.collection("responseIDs").get();
				userIDs = tmp.docs.map((doc) => doc.id);
				if (userIDs == null){
					throw Error("undefined userIDs")
				}
			}
			catch (error) {
				this.setState({ showErrorMessage: true, errorMessage: ("Error fetching response ids: " + error) });
				return;
			}
		}
		// Get resume content for each user
		const resumePromises = userIDs.map((user) => {
			return Promise.all([
				this.getResumeContent(user, 1),
				this.getResumeContent(user, 2),
			]);
		});

		// Get activity content for each user
		const activityPromises = userIDs.map((user) => {
			return Promise.all([
				this.getActivityContent(user, 1),
				this.getActivityContent(user, 2),
			]);
		});

		// Wait for all promises to resolve
		try {
			await Promise.all(resumePromises)
			// Create a CSV from the resume content
			this.setState({
				resumeCSVurl: this.createCSV(this.resumeContent),
			});
		}
		catch (error) {
			this.setState({ showErrorMessage: true, errorMessage: ("Error fetching resume" + error) })
		}

		// Wait for all promises to resolve
		try {
			await Promise.all(activityPromises)
			// Create a CSV from the activity content
			this.setState({
				activitiesCSVurl: this.createCSV(this.activityContent),
			});
		}
		catch (error) {
			this.setState({ showErrorMessage: true, errorMessage: ("Error fetching activity content" + error) })
		}
	}

	/** Get the content of the resume a user saw */
	getResumeContent(responseID, resumeNum) {
		// Get the reference to the resume
		const resumeRef = this.DATABASE.collection("responseIDs")
			.doc(responseID)
			.collection("values shown")
			.doc(`resume ${resumeNum}`);

		// Get the content of the resume
		return resumeRef
			.get()
			.then((doc) => {
				if (doc.exists) {
					this.resumeContent.push({
						responseID: responseID,
						resumeNum: resumeNum,
						...doc.data(),
					});
				} else {
					console.log("No such document!");
				}
			})
			.catch((error) => {
				console.error("Error getting document:", error);
			});
	}

	/** Get the activity of a user on a specific resume */
	getActivityContent(responseID, resumeNum) {
		// Get the reference to the resume
		const resumeRef = this.DATABASE.collection("responseIDs")
			.doc(responseID)
			.collection(`activityData_resume${resumeNum}`);

		// Get the content of the resume
		return resumeRef.get().then((querySnapshot) => {
			querySnapshot.forEach((doc) => {
				this.activityContent.push({
					responseID: responseID,
					resumeNum: resumeNum,
					activityID: doc.id,
					...doc.data(),
				});
			});
		});
	}

	/** Create a CSV from an array of dictionaries */
	createCSV(data) {
		// Convert the array of dictionaries to CSV format
		const csv = Papa.unparse(data);

		// Create a Blob containing the CSV data
		const blob = new Blob([csv], { type: "text/csv" });

		// Create a download link
		return URL.createObjectURL(blob);
	}

	render() {
		/* Login popup */
		if (!this.state.isAuthenticated) {
			return (
				<ModalReact className="modal_dtp" isOpen={!this.state.isAuthenticated}>
					<form
						onSubmit={(e) => {
							e.preventDefault();
							this.handleAdminLogin();
						}}
					>
						<div>
							<label htmlFor="email">Enter email: </label>
							<input
								type="email"
								id="email"
								onChange={this.handleChangeEmail.bind(this)}
								value={this.state.email}
								autoFocus
							/>
						</div>
						<div>
							<label htmlFor="password">Enter password: </label>
							<input
								type="password"
								id="password"
								onChange={this.handleChangePassword.bind(this)}
								value={this.state.password}
							/>
						</div>
						<button type="submit">Submit</button>
						{this.state.showErrorMessage && (
							<div id="red">{this.state.errorMessage}</div>
						)}
					</form>
				</ModalReact>
			);
		}

		return (
			<div className="overall">
				<div className="container">
					<div className="title">Logged in as {this.state.loggedInAs} </div>
					<div className="title">Download Data</div>

					{!this.state.activitiesCSVurl && !this.state.resumeCSVurl && !this.state.showErrorMessage && (
						<p>Processing...</p>
					)
					}

					{this.state.activitiesCSVurl && (
						<div className="horizontal" id="big">
							<a
								href={this.state.activitiesCSVurl}
								download={`activity_data.csv`}
							>
								Activity Data
							</a>
						</div>
					)}

					{this.state.resumeCSVurl && (
						<div className="horizontal" id="big">
							<a href={this.state.resumeCSVurl} download={`resume_data.csv`}>
								Resume Data
							</a>
						</div>
					)}
					<button type="reset" onClick={this.handleLogout}>Log out</button>
					{this.state.errorMessage && (
						<div id="red">{this.state.errorMessage}</div>
					)}
				</div>
			</div>
		);
	}
}

export default Admin;
