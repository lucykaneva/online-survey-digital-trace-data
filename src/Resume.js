import React from "react";
import "./App.css";
import Divider from "@material-ui/core/Divider";
import firebase from "./firebase";
import Accordion from "react-bootstrap/Accordion";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import VotingBlock from "./VotingBlock";

/*
  This is the main component for the resume page. It displays a resume with various sections that can be toggled open and closed.
  All of the randomization and pre-processing of the Firebase values is done here.
*/

export default class Resume extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			positionList: [],
		};

		// Add props to "this"
		this.recordActivity = this.props.recordActivity;

		const db = firebase.firestore();
		this.db = db;
		this.USER_DATA = db
			.collection("responseIDs")
			.doc(this.props.qualtricsUserId);
		this.RESUME_CONTENT = db.collection("resume");

		this.collapsibleOpened = this.collapsibleToggled.bind(this);
	}

	componentDidMount() {
		this.setState({ studyVersion: this.props.studyVersion });
		this.setState({ resumeVersion: this.props.resumeVersion }, () => {
			this.parseCandidateData(() => {
				// On the first resume, we'll decide the data the user will see in the whole study
				if (this.state.resumeVersion === 1) {
					this.getResume1Values(this.displayValues);
				} else {
					// Show the appropriate resume data
					this.getResume2Values(this.displayValues);
				}
			});
		});
	}

	/** The first resume has randomly-decided values. Decide them and put into state. */
	getResume1Values(callback) {
		// Select gender
		const isMan = Math.random() < 0.5;

		// Select name randomly from list of male/female candidates
		const nameIndex = Math.random() < 0.5 ? 0 : 1;
		let name = isMan
			? this.state.maleCandidates[nameIndex].name
			: this.state.femaleCandidates[nameIndex].name;

		// Select parenthood
		const isParent = Math.random() < 0.5;

		// Select education
		// Could be more than two options in the future
		const education = Math.random() < 0.5 ? "a" : "b";

		// Could be more than two options in the future
		const work1 = Math.random() < 0.5 ? "a" : "b";
		const work2 = Math.random() < 0.5 ? "a" : "b";

		// Store resume 1 values in state
		this.setState(
			{
				isMan: isMan,
				isParent: isParent,
				education: education,
				work1: work1,
				work2: work2,
				name: name,
				nameIndex: nameIndex,
			},
			// Now that info is in state, call the callback
			callback
		);

		// Create document for this user
		this.USER_DATA.set({});

		// Store resume 1 values in the database
		this.USER_DATA.collection("values shown").doc("resume 1").set({
			isMan: isMan,
			isParent: isParent,
			education: education,
			work1: work1,
			work2: work2,
			name: name,
			nameIndex: nameIndex,
		});
	}

	/** The second resume has the opposite values to the first. Calculate them and put into state. */
	getResume2Values(callback) {
		// Get the values shown to this user for resume 1
		this.USER_DATA.collection("values shown")
			.doc("resume 1")
			.get()
			.then((doc) => {
				const resume1values = doc.data();
				// Same gender
				const isMan = resume1values.isMan;

				// The other name
				const nameIndex = resume1values.nameIndex === 0 ? 1 : 0;
				const name = isMan
					? this.state.maleCandidates[nameIndex].name
					: this.state.femaleCandidates[nameIndex].name;

				// Opposite parenthood
				const isParent = !resume1values.isParent;

				// Opposite education
				// Could be more than two options in the future, which would need more logic
				const education = resume1values.education === "a" ? "b" : "a";

				// Opposite work history
				// Could be more than two options in the future, which would need more logic
				const work1 = resume1values.work1 === "a" ? "b" : "a";
				const work2 = resume1values.work2 === "a" ? "b" : "a";

				// Store resume 2 values in state
				this.setState(
					{
						isMan: isMan,
						isParent: isParent,
						education: education,
						work1: work1,
						work2: work2,
						name: name,
						nameIndex: nameIndex,
					},
					// Now that info is in state, call the callback
					callback
				);

				// Store resume 2 values in the database
				this.USER_DATA.collection("values shown").doc("resume 2").set({
					isMan: isMan,
					isParent: isParent,
					education: education,
					work1: work1,
					work2: work2,
					name: name,
					nameIndex: nameIndex,
				});
			});
	}

	/** Once we've decided the values, actually display them (based on state) */
	displayValues() {
		// Initial phone screen notes
		this.RESUME_CONTENT.doc("notes from initial phone screen")
			.get()
			.then((doc) => {
				let parenthoodText = null;
				// Based on parent/nonparent
				if (this.state.isParent) {
					parenthoodText = doc.data().nonparent.toString();
				} else {
					parenthoodText = doc.data().parent.toString();
				}

				// Put the text into a nicer format
				let split = parenthoodText
					// Split each sentence into a bullet point
					.split(".")
					// Clean up whitespace
					.map((str) => str.trim())
					// Remove any empty strings (by removing falsy values)
					.filter(Boolean);
				this.setState({ bulletList: split });
			});

		// Misc section
		this.RESUME_CONTENT.doc("misc")
			.get()
			.then((doc) => {
				let parenthoodText = null;
				// Based on parent/nonparent
				if (this.state.isParent) {
					parenthoodText = doc.data().nonparent.toString();
				} else {
					parenthoodText = doc.data().parent.toString();
				}

				// Put the text into a nicer format
				let split = parenthoodText
					// Split each sentence into a bullet point
					.split(".")
					// Clean up whitespace
					.map((str) => str.trim())
					// Remove any empty strings (by removing falsy values)
					.filter(Boolean);
				this.setState({ misc: split });
			});

		// Education
		this.RESUME_CONTENT.doc(`education ${this.state.education}`)
			.get()
			.then((doc) => {
				this.setState({ degree: doc.data().degree });
				this.setState({ duration: doc.data().duration });
				this.setState({ major: doc.data().major });
				this.setState({ university: doc.data().university });
			});

		// Work experience
		this.RESUME_CONTENT.doc(`work box 1${this.state.work1}`)
			.get()
			.then((doc) => {
				this.addPositionToList(doc.data());
			});
		this.RESUME_CONTENT.doc(`work box 2${this.state.work1}`)
			.get()
			.then((doc) => {
				this.addPositionToList(doc.data());
			});
	}

	/** Called when a section is toggled open/closed */
	collapsibleToggled(eventKey) {
		if (eventKey === 0) {
			// Education Section
			this.recordActivity(
				"collapsibleToggled",
				"education",
				"toggled education section "
			);
		} else if (eventKey === 1) {
			// Work Section
			this.recordActivity(
				"collapsibleToggled",
				"work",
				"toggled work section "
			);
		} else if (eventKey === 2) {
			// Misc Section
			this.recordActivity(
				"collapsibleToggled",
				"misc",
				"toggled misc section "
			);
		}
	}

	/** Fetches the candidate data (name and gender) from the database and stores it in state */
	parseCandidateData(callbackFunc) {
		const rawData = this.db.collection("candidates");

		const maleCandidates = [];
		const femaleCandidates = [];

		rawData
			.where("isMan", "==", true)
			.get()
			.then((querySnapshot) => {
				querySnapshot.forEach((doc) => {
					maleCandidates.push(doc.data());
				});
			})
			.then(() => {
				// After fetching male candidates, fetch female candidates
				return rawData
					.where("isMan", "==", false)
					.get()
					.then((querySnapshot) => {
						querySnapshot.forEach((doc) => {
							femaleCandidates.push(doc.data());
						});
					});
			})
			.then(() => {
				// Set to state and call callback
				this.setState(
					{
						maleCandidates: maleCandidates,
						femaleCandidates: femaleCandidates,
					},
					callbackFunc
				);
			})
			.catch((error) => {
				console.error("Error getting candidates:", error);
			});
	}

	/** Helper function: search through the text and replace option placeholders based on gender */
	replaceGenderOptions(text) {
		// We expect all options to be in the format [maleOption/femaleOption]
		const matches = text.match(/\[(.*?)\/(.*?)\]/g);

		if (!matches) {
			return text;
		}

		matches.forEach((match) => {
			// Slice off the brackets and split the options
			const options = match.slice(1, -1).split("/");
			// Replace the placeholder with the appropriate option
			text = text.replace(match, this.state.isMan ? options[0] : options[1]);
		});

		return text;
	}

	/** Helper function: append a new position to the positionList */
	addPositionToList(newPosition) {
		this.setState((prevState) => ({
			positionList: [...prevState.positionList, newPosition],
		}));
	}

	/** Runs when the user moves the mouse */
	_onMouseMove(e) {
		// this.recordActivity("mouse", `(${e.clientX},${e.clientY})`, "moved mouse");
	}

	render() {
		// If our data hasn't loaded yet, show a loading screen
		if (
			!(
				this.state.bulletList &&
				this.state.positionList.length > 0 &&
				this.state.name
			)
		) {
			return <h1>Loading...</h1>;
		}

		return (
			<div className="overall">
				<div className="App" onMouseMove={this._onMouseMove.bind(this)}>
					<div className="resume">
						<div>
							<img
								className="profile_image"
								src={imageToURL(this.state.isMan ? "male_user" : "female_user")}
								alt="the candidate"
							/>
							<div className="header">
								{this.state.name ||
									`Candidate ${this.state.resumeVersion === 1 ? "1" : "2"}`}
							</div>

							<div className="votingblock_notes">
								<VotingBlock
									sectionName="notes"
									recordActivity={this.recordActivity}
								/>

								<div className="notes">
									Notes from Initial Phone Screen:
									<ul>
										{this.state.remoteNotesText && (
											<li>
												{this.replaceGenderOptions(this.state.remoteNotesText)}
											</li>
										)}
										{this.state.bulletList.map((item, index) => {
											return (
												<li key={index}>{this.replaceGenderOptions(item)}</li>
											);
										})}
									</ul>
								</div>
							</div>

							<Accordion>
								{/* Education Section */}
								<Card>
									<Card.Header
										style={{
											background: "white",
											paddingLeft: 0,
											paddingRight: 0,
										}}
									>
										<Accordion.Toggle
											as={Button}
											style={{
												color: "black",
												width: "100%",
												display: "flex",
												flexDirection: "row",
												justifyContent: "space-between",
												fontSize: "18px",
												alignItems: "center",
											}}
											variant="link"
											eventKey="0"
											onClick={() =>
												this.setState(
													{
														educationSectionOpened:
															!this.state.educationSectionOpened,
													},
													() => {
														this.collapsibleToggled(0);
														if (this.state.educationSectionOpened) {
															// Mark the other sections as closed
															this.setState({
																workSectionOpened: false,
																miscSectionOpened: false,
															});
														}
													}
												)
											}
										>
											Education{" "}
											<img
												id="toggle_icon"
												src={
													this.state.educationSectionOpened
														? imageToURL("minus_icon")
														: imageToURL("plus_icon")
												}
												alt="toggle icon"
											/>
										</Accordion.Toggle>
									</Card.Header>

									<Accordion.Collapse eventKey="0">
										<Card.Body>
											<div className="votingblock">
												<VotingBlock
													sectionName="education"
													recordActivity={this.recordActivity}
												/>
												<div id="subtext">
													{this.state.university}
													<div id="subinfo">
														{this.state.degree}, {this.state.major}
													</div>
													<div id="subinfogray">{this.state.duration}</div>
												</div>
											</div>
										</Card.Body>
									</Accordion.Collapse>
								</Card>

								{/* Work Section */}
								<Card>
									<Card.Header
										style={{
											background: "white",
											paddingLeft: 0,
											paddingRight: 0,
											borderTop: "1px solid black",
										}}
									>
										<Accordion.Toggle
											as={Button}
											style={{
												color: "black",
												width: "100%",
												display: "flex",
												flexDirection: "row",
												justifyContent: "space-between",
												fontSize: "18px",
												alignItems: "center",
											}}
											variant="link"
											eventKey="1"
											onClick={() =>
												this.setState(
													{
														workSectionOpened: !this.state.workSectionOpened,
													},
													() => {
														this.collapsibleToggled(1);
														if (this.state.workSectionOpened) {
															this.setState({
																// Mark the other sections as closed
																educationSectionOpened: false,
																miscSectionOpened: false,
															});
														}
													}
												)
											}
										>
											Work Experience
											<img
												id="toggle_icon"
												src={
													this.state.workSectionOpened
														? imageToURL("minus_icon")
														: imageToURL("plus_icon")
												}
												alt="toggle icon"
											/>
										</Accordion.Toggle>
									</Card.Header>

									{/* Position List */}
									<Accordion.Collapse eventKey="1">
										<Card.Body>
											{this.state.positionList.map((position, index) => {
												return (
													<div key={index}>
														<div className="votingblock">
															<VotingBlock
																sectionName={`work${index + 1}`}
																recordActivity={this.recordActivity}
															/>

															<div id="subtext">
																{" "}
																{position.title}
																<div id="horizontal">
																	<div id="subinfo">{position.company}</div>
																</div>
																<div id="subinfogray">{position.duration}</div>
																<div id="subinfo">{position.description}</div>
															</div>
														</div>
														<Divider />
													</div>
												);
											})}
										</Card.Body>
									</Accordion.Collapse>
								</Card>

								{/* Misc Section */}
								<Card>
									<Card.Header
										style={{
											background: "white",
											paddingLeft: 0,
											paddingRight: 0,
											borderTop: "1px solid black",
										}}
									>
										<Accordion.Toggle
											as={Button}
											style={{
												color: "black",
												width: "100%",
												display: "flex",
												flexDirection: "row",
												justifyContent: "space-between",
												fontSize: "18px",
												alignItems: "center",
											}}
											variant="link"
											eventKey="2"
											onClick={() =>
												this.setState(
													{
														miscSectionOpened: !this.state.miscSectionOpened,
													},
													() => {
														this.collapsibleToggled(2);
														if (this.state.miscSectionOpened) {
															// Mark the other sections as closed
															this.setState({
																educationSectionOpened: false,
																workSectionOpened: false,
															});
														}
													}
												)
											}
										>
											Miscellaneous
											<img
												id="toggle_icon"
												src={
													this.state.miscSectionOpened
														? imageToURL("minus_icon")
														: imageToURL("plus_icon")
												}
												alt="toggle icon"
											/>
										</Accordion.Toggle>
									</Card.Header>

									<Accordion.Collapse eventKey="2">
										<Card.Body>
											<div className="votingblock">
												<VotingBlock
													sectionName="misc"
													recordActivity={this.recordActivity}
												/>
												<div className="notes">
													Other:
													<ul>
														{this.state.misc.map((item, index) => {
															return (
																<li key={index}>
																	{this.replaceGenderOptions(item)}
																</li>
															);
														})}
													</ul>
												</div>
											</div>
										</Card.Body>
									</Accordion.Collapse>
								</Card>
							</Accordion>
						</div>
					</div>
				</div>
			</div>
		);
	}
}

/**
 * Turns an image name into the src, relative to /public/images. Image should be a png.
 */
export function imageToURL(imageName) {
	return `${process.env.PUBLIC_URL}/images/${imageName}.png`;
}
