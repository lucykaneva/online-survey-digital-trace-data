import React from "react";
import "./App.css";
import Divider from "@material-ui/core/Divider";
import firebase from "./firebase";
import Card from "react-bootstrap/Card";

/*
  This is the main component for the resume page. It displays a resume with various sections that can be toggled open and closed.
  All of the randomization and pre-processing of the Firebase values is done here.
*/
export default class Resume extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			positionList: [],
			highlights: []
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

	/**Produces the highlighted form of the text in a given field by iterating all of the highlights 
	and finding the ones that are in scope in this field.*/
	handle_splice_highlights_field = (highlights, text, field_name) => {
		text = text || "";
		const highlights_for_field = highlights.filter((h) => h.field === field_name)
		const sorted = highlights_for_field.sort((ha, hb) => ha.start - hb.start)
		let position = 0
		let array_of_string_text = []
		sorted.forEach((highlight) => {
			const before_highlight = text.slice(position, highlight.start)
			const highlight_string = text.slice(highlight.start, highlight.end)
			if (highlight.start < position) return;
			position = highlight.end
			const highlighted = <mark key={highlight.start} onClick={() => this.remove_highlight()}>{highlight_string}</mark>
			array_of_string_text.push(before_highlight, highlighted)
		}
		)
		array_of_string_text.push(text.slice(position, text.length))
		return array_of_string_text
	}

	/**Removes the highlight that matches that was clicked*/
	remove_highlight = () => {
		const selection = window.getSelection();

		if (!selection || selection.rangeCount === 0 || !selection.isCollapsed) return;
		const range = selection.getRangeAt(0)
		const start_node = range.startContainer
		const label_start = (start_node.nodeType === 1 ? start_node : start_node.parentElement).closest("[data-field]");
		if (!label_start) return;
		const field = label_start.dataset.field;
		const before = document.createRange();
		before.selectNodeContents(label_start);
		before.setEnd(range.startContainer, range.startOffset);
		const offset = before.toString().length;
		const text = label_start.textContent;
		//find the bounds of the word
		const isWordChar = (ch) => ch !== undefined && /[\p{L}\p{N}]/u.test(ch);
		let wordStart = offset;
		while (wordStart > 0 && isWordChar(text[wordStart - 1])) {
			wordStart--;
		}
		let wordEnd = offset;
		while (wordEnd < text.length && isWordChar(text[wordEnd])) {
			wordEnd++;
		}
		if (wordStart === wordEnd) return;
		const h = this.state.highlights.find(
			(x) => x.field === field && x.start <= offset && offset <= x.end
		);
		if (!h) return; const cutStart = Math.max(h.start, wordStart);
		const cutEnd = Math.min(h.end, wordEnd);
		if (cutStart >= cutEnd) return; // no overlap, nothing to cut
		const leftPiece = cutStart > h.start ? { start: h.start, end: cutStart, field: h.field, text: text.slice(h.start, cutStart), timestamp: Date.now() } : null
		const rightPiece = cutEnd < h.end ? { start: cutEnd, end: h.end, field: h.field, text: text.slice(cutEnd, h.end), timestamp: Date.now() } : null
		const pieces = []
		if (leftPiece !== null && leftPiece.text.trim() !== "") {
			pieces.push(leftPiece)
		}
		if (rightPiece !== null && rightPiece.text.trim() !== "") {
			pieces.push(rightPiece)
		}
		this.setState((prevState) => ({
			highlights: [
				...prevState.highlights.filter((x) => x !== h),
				...pieces,
			]
		}));
	}

	handle_selection = () => {
		const selection = window.getSelection();
		if (!selection || selection.isCollapsed) return;

		const range = selection.getRangeAt(0)
		const start_node = range.startContainer
		const end_node = range.endContainer
		const label_start = (start_node.nodeType === 1 ? start_node : start_node.parentElement).closest("[data-field]");
		const label_end = (end_node.nodeType === 1 ? end_node : end_node.parentElement).closest("[data-field]");
		if (label_end !== label_start || label_start == null || label_end == null) return

		const field = label_start.dataset.field;
		const before = document.createRange();
		before.selectNodeContents(label_start);
		before.setEnd(range.startContainer, range.startOffset);
		const start = before.toString().length;
		const end = start + range.toString().length;

		const overlapping = this.state.highlights.filter(
			(h) => h.field === field && h.start < end && start < h.end
		);

		const new_start = Math.min(start, ...overlapping.map((h) => h.start));
		const new_end = Math.max(end, ...overlapping.map((h) => h.end))
		const new_text = label_start.textContent.slice(new_start, new_end);
		this.setState((prevState) => ({
			highlights: [
				...prevState.highlights.filter(
					(h) => !(h.field === field && h.start < end && start < h.end)
				),
				{ start: new_start, end: new_end, field: field, text: new_text, timestamp: Date.now() },
			],
		}));
	}

	//*Renders the highlighted text inside the field by calling the handle_splice_highlights_field method.*/
	render_highlighted = (text, field_name) =>
		this.handle_splice_highlights_field(this.state.highlights, text, field_name);

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
		this.RESUME_CONTENT.doc(`work box 2${this.state.work2}`)
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
			<div className="overall" onMouseUp={this.handle_selection} >
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
											<li data-field={`initial phone notes ${index}`} key={index}>{this.render_highlighted(this.replaceGenderOptions(item), `initial phone notes ${index}`)}</li>
										);
									})}
								</ul>
							</div>
							{/* Education Section */}
							<Card>
								<Card.Header>
									<div className="title"> Education </div>
								</Card.Header>
								<Card.Body>
									<div id="subtext">
										<div data-field="university" >
											{this.render_highlighted(this.state.university, "university")}
										</div>
										<div id="subinfo" data-field="degree and major">
											{this.render_highlighted(
												`${this.state.degree || ""}, ${this.state.major || ""}`,
												"degree and major"
											)}
										</div>
										<div id="subinfogray" data-field="duration" >{this.render_highlighted(this.state.duration, "duration")}</div>
									</div>
								</Card.Body>
							</Card>

							{/* Work Section */}
							<Card>
								<Card.Header>
									<div className="title"> Work </div>
								</Card.Header>
								{/* Position List */}
								<Card.Body>
									{this.state.positionList.map((position, index) => {
										return (
											<div key={index}>
												<div id="subtext">
													{" "}
													<div data-field={`position title ${index + 1}`}>{this.render_highlighted(position.title, `position title ${index + 1}`)}</div>
													<div id="horizontal">
														<div id="subinfo" data-field={`company ${index + 1}`} >{this.render_highlighted(position.company, `company ${index + 1}`)}</div>
													</div>
													<div id="subinfogray" data-field={`duration ${index + 1}`} >{this.render_highlighted(position.duration, `duration ${index + 1}`)}</div>
													<div id="subinfo" data-field={`description ${index + 1}`}>{this.render_highlighted(position.description, `description ${index + 1}`)}</div>
												</div>
												{index < this.state.positionList.length - 1 && <Divider />}
											</div>
										);
									})}
								</Card.Body>
							</Card>

							{/* Misc Section */}
							<Card>
								<Card.Header>
									<div className="title"> Miscellaneous </div>
								</Card.Header>
								<Card.Body>
									<div className="votingblock">
										<div className="notes">
											<ul>
												{this.state.misc.map((item, index) => {
													return (
														<li data-field={`misc ${index}`} key={index}>
															{this.render_highlighted(this.replaceGenderOptions(item), `misc ${index}`)}
														</li>
													);
												})}
											</ul>
										</div>
									</div>
								</Card.Body>
							</Card>
						</div>
					</div>
				</div>
			</div >
		);
	}
}

/**
 * Turns an image name into the src, relative to /public/images. Image should be a png.
 */
export function imageToURL(imageName) {
	return `${process.env.PUBLIC_URL}/images/${imageName}.png`;
}
