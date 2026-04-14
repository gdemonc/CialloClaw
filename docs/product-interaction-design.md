# Product Interaction Design Document

This document provides comprehensive interaction design specifications for the floating ball system, including interaction entry points, state management, and output mechanisms.

---

# Floating Ball Interaction Entry

## 1. Design Goals

* The product aims to lower the barrier for users to collaborate with Agent, reduce reliance on keyboard input and traditional chat boxes, and prioritize voice calls, context awareness, and proactive recommendations to handle user needs. The product does not use traditional chat boxes as the main entry point, but emphasizes Agent's ability to understand, judge, and assist at the task site. Lightweight conversations between users and Agent are primarily handled through bubbles near the floating ball, rather than entering a complete chat interface.

* The product aims to solve the following problems:

  * Reduce typing for users
  
  * Reduce context supplementation for users
  
  * Enable users to initiate collaboration at the current task site
  
  * Allow users to quickly understand what help Agent can currently provide without entering a heavy chat interface

## 2. Interaction Design Principles

### 2.1 Voice First, Text as Supplement

* The product prioritizes voice calls for Agent collaboration to lower input barriers. Text input is retained but only as a supplementary capability, used when users cannot speak, recommendations are inaccurate, or precise command supplementation is needed.

### 2.2 Context First, Chat Later

* The product prioritizes understanding context at the current task site and helps users initiate collaboration through recommendations, hints, and lightweight handling, rather than using traditional chat boxes as the default main entry point.

### 2.3 Lightweight Initiation, Structured Handling

* Product interaction unfolds in layers. Users initiate needs at the lowest possible cost, and the system handles collaboration processes and results through a structured workbench.

### 2.4 Low-Disturbance Triggering

* Proactive recommendations and hints are based on the premise that users clearly approach the Agent entry point and have been active recently, rather than triggering globally based on stationary stays at arbitrary positions on the page.

## 3. Interaction Entry: Floating Ball

* The floating ball is the default persistent entry point, maintaining low presence and staying close to the user's current workflow. It is not a main interface that users need to specifically open, but a task site entry that is always reachable, low-friction, and low-disturbance. Overall interaction revolves around the floating ball.

* The floating ball is both an operation entry and an anchor for users to perceive Agent availability. When users click, double-click, long-press, hover, or drag near the floating ball, they are essentially sending collaboration signals of different intensities to the system. Among them, left-click in standby state is a lightweight approach action used to express "I may need help."

## 4. Interaction Entries

* Main interaction entries include:

  * Left-click
  
  * Left double-click
  
  * Left long-press
  
  * Mouse hover
  
  * File drag
  
  * Text selection

* Notes:

  * Upward and downward swipes after left long-press are not independent interaction entries, but state control gestures during the call invocation process
  
  * Upward swipe is used to lock the call
  
  * Downward swipe is used to cancel the current call invocation
  
  * Floating ball click after text selection and text drag to the floating ball are subsequent trigger actions centered on the current text object
  
  * After file drag to the floating ball, it is a subsequent trigger action centered on the current file object

## 5. Functions Corresponding to Each Interaction Method

### 5.1 Left-click

* Left-click serves different purposes in different states.

* When no event is triggered and the system is in default standby state, simple left-click is an action in standby mode. This action itself does not directly enter a heavy interaction flow, but serves as a lightweight signal that the user approaches the floating ball and expresses "I may need help."

* When the task object is already clear, left-click is mainly used to handle the floating ball interaction that has already entered an operable state, and no longer defaults to directly opening the dashboard.

* When the user has selected text or dragged the current task object to the floating ball, left-click can be used to continue initiating subsequent collaboration. After receiving the trigger, the system first enters the intent confirmation process, then executes the task according to the user's confirmed or corrected intent.

### 5.2 Left Double-click

* Left double-click opens the dashboard.

### 5.3 Left Long-press

* Left long-press is used to invoke voice call capability.

* This is the main expression method. Users do not need to enter a chat interface or organize complex prompts; they only need to hold the floating ball and naturally speak their needs to initiate collaboration.

* During left long-press, the following state controls are supported:

  * Upward swipe: Locks the current call state and enters continuous call mode
  
  * Downward swipe: Cancels the current call invocation and terminates the current input process

### 5.4 Mouse Hover

* After hovering over the floating ball for x seconds, a lightweight dialog box appears below the floating ball, allowing users to quickly supplement a text command. At the same time, the system can provide questions that users might want to ask based on the current context.

* The hover layer handles two types of capabilities:

  * User active input: Supplement a need through lightweight input, and support uploading local files via the "attach file" button
  
  * System proactive recommendation: Provide possible questions based on the current context

### 5.5 File Drag

* Users can directly drag files to the floating ball to initiate collaboration centered on that file.

* File drag is used to explicitly set the current file as the task object. After receiving the file, the system first performs necessary file parsing, then enters the intent confirmation process, and executes the task according to the user's confirmed or corrected intent.

* Applicable scenarios include:

  * Analysis
  
  * Summary
  
  * Extraction
  
  * Rewrite
  
  * Explanation

### 5.6 Text Selection

* When a user selects a segment of text on the current page, the system identifies that text as the current most explicit local task object.

* After text is selected, the floating ball enters an operable prompt state, reminding the user that they can immediately initiate collaboration centered on that segment. Users can enter the intent confirmation process by clicking the floating ball or dragging the selected text to the floating ball.

* Specific visual style to be determined by subsequent visual design.

* Applicable scenarios include:

  * Questions centered on local content
  
  * Explanation
  
  * Polish
  
  * Translation
  
  * Summary
  
  * Extension

## 6. Interaction Layers

### Layer 1: Floating Ball

* Default persistent entry, low presence, always close to the task site.

### Layer 2: Voice Expression

* Mainly through left long-press, as the main expression method. Users can lock calls through upward swipe after invocation and cancel the current input through downward swipe.

### Layer 3: Lightweight Handling and Intent Confirmation

* When users hover, click the floating ball after selecting text, or drag text/files to the floating ball, the system enters the lightweight handling layer.

* This layer handles two types of capabilities:

  * Handling user brief supplementation through the lightweight dialog box below the floating ball
  
  * Analyzing, confirming, and correcting user intent through the bubble above the floating ball and the lightweight dialog box below before formal execution

### Layer 4: Dashboard Handling

* Left double-click opens the dashboard.

## 7. Detailed Interaction Instructions

### 7.1 Call Mode

* In call mode, Agent monitors the user's screen usage dynamics in real-time and combines user language with screen behavior for understanding.

* After the user invokes call capability through left long-press, different gestures can control the current state:

  * Keep holding: Short expression, ends this input after release
  
  * Upward swipe lock: Enters continuous call mode, suitable for continuous expression, background supplementation, or multi-round follow-up questions
  
  * Downward swipe cancel: Abandons this input and does not enter subsequent processing

* Scenario descriptions:

  * **Mouse hover or highlight and dictate needs**: When the user hovers or highlights a segment and says something like "help me organize," Agent identifies the paragraph where the mouse is located from the full screenshot and responds based on that segment.
  
  * **Multiple scattered segments**: Users can speak and click simultaneously. Agent combines the user's speaking time with multiple screenshots to identify the paragraph where the mouse is and respond.
  
  * **Drag rich text**: When the user drags rich text and says "please help me analyze/summarize" to Agent, Agent parses the current rich text content and responds.
  
  * **Can be interrupted at any time**: When Agent is responding, users can interrupt at any time and supplement needs. Call mode is not one-way execution; users should be allowed to continue correcting, supplementing, or modifying task requirements during the response process.

### 7.2 Hover Mode

* After the user hovers over the floating ball for x seconds, Agent obtains the current interface content through screenshots or other screen perception methods and displays a lightweight dialog box below the floating ball. At the same time, the system can propose several possible questions based on the current context.

* Hover mode includes two types of capabilities:

  * User active input: Quickly supplement a need through the lightweight dialog box below the floating ball, and support uploading local files via the "attach file" button
  
  * System proactive recommendation: Provide possible questions based on the current context

* Proactive recommendation defaults to triggering only when the user hovers over the floating ball, not triggering globally based on stationary stays at arbitrary positions on the page.

### 7.3 Proactive Recommendation Strategy in Non-Call Mode

* In non-call mode, proactive recommendation is not only used to help users quickly initiate collaboration but also serves to moderately establish Agent presence.

* Trigger principles:

  * Trigger only when the user has been active recently
  
  * Trigger only when the mouse hovers over the floating ball
  
  * Do not trigger at fixed frequency unconditionally
  
  * Do not trigger when stationary for a long time, inactive, or when the desktop has no changes

* Suggested trigger conditions:

  * Currently in non-call mode
  
  * Mouse has hovered over the floating ball for several seconds
  
  * User has had interaction behavior in the last 1 to 2 minutes
  
  * Current desktop content or task context has perceivable information
  
  * Minimum cooldown time has passed since the last proactive recommendation

* Suggested non-trigger conditions:

  * Mouse has stayed for a long time but the user has no continuous operation
  
  * Desktop content has not changed for a long time
  
  * User has left the device or is obviously inactive
  
  * Recommendation has just been triggered and is still in cooldown period

### 7.4 Other Interactions in Non-Call Mode

* In non-call mode, users mainly initiate collaboration through the following methods:

  * Hover recommendation
  
  * Lightweight text input
  
  * File drag
  
  * Text selection

* In this mode, the hover handling layer is more critical; it is responsible not only for handling user lightweight expression but also for moderately reducing the barrier to initiating tasks through appropriate recommendations.

### 7.5 Intent Confirmation Process Based on Text or File

* When the user selects text or drags a file to the floating ball, the system identifies the corresponding content as the current task object and enters the intent confirmation process.

* For text scenarios, the floating ball enters an operable prompt state, reminding the user that they can continue to initiate collaboration centered on that segment. Specific visual style to be determined by subsequent visual design.

* For file scenarios, the system can first complete basic parsing, then enter intent judgment combining file content with current context.

* After receiving the trigger, the system does not directly return results but first performs intent analysis combining the task object with current context, judging what task type and output method the user is more likely to want to execute.

* Feedback structure is as follows:

  * **Bubble above floating ball**: As a lightweight conversation handling area between user and Agent, used to display the system's judgment of user intent, confirmed replies, and subsequent lightweight results
  
  * **Dialog box below floating ball**: As a lightweight input and control area, used to display confirmation buttons and allow users to input corrected intent

* If the user clicks confirm, the system executes according to the current judgment; if the user inputs corrected intent, the system executes according to the new intent. Execution results continue to be presented in the bubble.

* When the output content in the bubble is too long and not suitable for complete display in the bubble, the system automatically saves the results to a workspace document and automatically opens that document for the user to view.

## 8. Dashboard Handling

* This product does not adopt the mode of "both input and output completed in the traditional chat box." Lightweight conversations, intent confirmation, and immediate results are primarily handled through bubbles near the floating ball and the lightweight operation area below; when users need to enter a more complete work interface, they can open the dashboard by left double-clicking.

## 9. Interaction Summary

* Overall interaction logic is as follows:

  * Floating ball is the default entry
  
  * When no event is triggered, left-click is a lightweight action in standby mode
  
  * Voice call is the main expression method
  
  * Left long-press is responsible for invoking voice call
  
  * Upward swipe is used to lock the call
  
  * Downward swipe is used to cancel the call
  
  * Mouse hover provides lightweight input and proactive recommendation
  
  * After text selection, the floating ball enters an operable prompt state
  
  * Users can initiate collaboration by clicking the floating ball, dragging text to the floating ball, or dragging files to the floating ball
  
  * Lightweight conversations between users and Agent are primarily handled through bubbles above the floating ball
  
  * The dialog box below the floating ball is mainly used for lightweight input, confirmation, and modification
  
  * The system first performs intent analysis, then completes confirmation or correction through the bubble and dialog box below
  
  * Left double-click opens the dashboard

---

# Floating Ball Other Interaction States

This document supplements the description of mechanisms that **do not belong to the product's explicit interaction entries** but affect the floating ball's presence, proactive reminders, intent handling, and overall experience rhythm.

These contents are not listed alongside explicit entries such as left-click, double-click, long-press, mouse hover, file drag, and text selection, but exist as a set of **auxiliary judgment and presentation mechanisms** to make the system's behavior more natural, restrained, and continuous in different states.

## 1. State Judgment Supplement

To control reminder rhythm and presentation intensity, the system needs to first judge the current state before deciding whether to remind and how to remind.

### 1.1 Static Mode

When the mouse stays on the desktop for a long time, the position has no obvious changes for a long time, desktop content remains stable, and the user has no new keyboard, mouse, or other interaction behavior, the system can consider that it has entered static mode.

Static mode is not equivalent to the user leaving the device, nor is it equivalent to the user having no needs. It is more suitable as a conservative judgment to prompt the system that the current proactive disturbance tendency should be reduced.

In static mode, it is suggested to:

* Reduce reminder frequency

* Reduce reminder intensity

* Extend the cooldown time for the next proactive reminder

* Avoid repeatedly triggering the same type of reminder

### 1.2 Active Stay State

If the user has continuous behavior recently, even if staying in a certain position for several seconds, it should not be directly judged as static mode, but should be understood that the user may be reading, thinking, or observing the current content.

In this case, the floating ball can moderately refresh its presence once, but should not use high-intensity, continuous reminder methods.

### 1.3 Operable State

When the system has identified an explicit task object, such as the user has selected text, dragged in a file, or formed an explicit context, the system can enter an operable state.

Operable state is not equivalent to the system executing a task, but indicates that conditions for continuing to handle collaboration currently exist. At this time, the floating ball can remind the user to continue operating through lightweight prompts.

## 2. Proactive Reminder Supplement

The floating ball's proactive reminders should follow the principle of being **lightweight, ignorable, and non-interrupting**. Its goal is not to require users to interact immediately, but to make users aware that:

* Agent can currently provide help

* Current content may be able to continue processing

* Users can initiate collaboration at any time when needed

### 2.1 Reminder Dimensions

Proactive reminder capability is suggested to be split into two adjustable variables:

* **Reminder level**: The degree of prominence and presence strength of the reminder method

* **Reminder frequency**: The number of times and intervals between proactive reminders

The system should not use the same set of reminder strategies for a long time, but should allow short-term adjustment and long-term adaptation to coexist.

### 2.2 Short-term Adjustment

In the short term, the floating ball can use default reminder level and reminder frequency. Users can input thoughts through the dialog box below the floating ball, express positive or negative feedback, and quickly adjust the current reminder strategy. Adjustable directions include:

* Increase reminder level

* Decrease reminder level

* Increase reminder frequency

* Decrease reminder frequency

The goal of short-term adjustment is quick correction, making the system closer to the user's acceptance range for disturbance level in the current stage.

### 2.3 Long-term Adaptation

In the long-term use process, the floating ball can gradually adjust reminder level and reminder frequency based on mirror memory user profile and historical feedback. Long-term signals that can be referenced include:

* Whether users frequently respond to proactive reminders

* Whether users frequently ignore proactive reminders

* User positive and negative feedback on reminders

* User acceptance level for reminders in different task scenarios

* User overall collaboration preference and disturbance tolerance

The goal of long-term adaptation is to form a reminder strategy that better fits personal preferences, rather than always relying on uniform default values.

## 3. Floating Ball Form Design

The floating ball should not always maintain a single visual state, but should switch between different forms according to **system state** and **current handling object**, allowing users to quickly understand:

* Whether it is currently available

* What the system is doing

* Whether user attention is needed

* What type of input is currently being mainly handled

It is suggested to split the form into two layers:

* **System state form**: Expresses the overall stage the system is currently in

* **Interaction handling form**: Expresses the input type or task object the system is currently handling

The two layers can coexist, but at the same moment, there should always be one main state that is clearly perceivable.

### 3.1 System State Forms

It is suggested to unify and converge into the following categories:

#### Standby Form

Indicates that the system is currently in default available state, with no ongoing tasks and no matters that require immediate user attention. This form should have low presence, not proactively disturb, be easy to identify, and be able to enter interaction at any time. It is also the default fallback state after other states end.

#### Invocable Form

When the user approaches the floating ball, hovers near the floating ball, or the system judges that the user is currently in an active state that can be lightly handled, the floating ball can enter an invocable form. This form is used to remind the user that they can currently continue to click, input, long-press, or drag, but overall should remain restrained.

#### Handling Form

When the user has started inputting or has provided a task object, the floating ball enters a handling form. This type of state can cover voice listening, text selection, text drag, file drag, and other scenarios, used to express that the system has started receiving current input.

#### Intent Confirmation Form

When the system has identified the task object but still needs to confirm what the user really wants to do, the floating ball should enter an intent confirmation form. This state emphasizes that the current focus is not on direct execution, but on confirming intent.

#### Processing Form

When the system has received the task and is parsing context, understanding needs, or executing processing, the floating ball should switch to a processing form. This form is used to remind that the task has been successfully received and the system is continuing to advance.

#### Waiting for Confirmation Form

When the system has given intent judgment, result suggestion, or pending items but has not yet received user feedback, the floating ball can enter a waiting for confirmation form. This state reminds that the process has not yet ended, and the next step depends on user confirmation, modification, or ignoring.

#### Completed Form

When the system has completed the current task and has results to display or can enter the next action, the floating ball enters a completed form. This form can moderately increase presence for a short time, but should not be maintained for a long time, and should fall back at an appropriate time.

#### Exception Form

When task execution fails, understanding is abnormal, the process is interrupted, or current capability is temporarily unavailable, the floating ball enters an exception form. The focus of exception form is not simply to remind of failure, but to help users understand why it did not continue to complete, and whether retry, supplementation, method switching, or waiting for environment recovery is needed next.

### 3.2 Interaction Handling Forms

Interaction handling forms are used to express what type of input the system is currently mainly handling. It is suggested to unify into the following categories:

* Hover handling

* Text selection handling

* Text drag handling

* File drag handling

* Voice handling

* Recommendation handling

* Result handling

The purpose of these forms is not to establish an independent state machine for each, but to provide context information for the system state, helping users quickly understand the current handling object.

### 3.3 Combination Principles

System state forms and interaction handling forms can appear in combination, for example:

* Standby form + no handling

* Handling form + voice handling

* Intent confirmation form + text selection handling

* Processing form + file drag handling

* Completed form + result handling

* Waiting for confirmation form + recommendation handling

Through this combination method, it is possible to avoid designing a completely independent new state for each fragmented scenario.

### 3.4 Switching Principles

Switching between different floating ball forms should follow the following principles:

* State meaning is clear, users can quickly understand

* Only one main state is expressed at the same moment, avoiding mixing

* Form switching has clear correspondence with user actions or system stages

* Maintain naturalness when falling back from strong state to weak state

* Do not frequently flash due to fragmented state changes

* Visual changes serve state understanding, not simply creating presence

## 4. Handling Logic for Different Interaction Methods

Although different interaction methods have different trigger methods, the overall logic should be unified: **First identify the input object, then judge whether intent confirmation is needed, then enter processing or result handling.**

### 4.1 Voice Recognition

When the user initiates a call through left long-press or enters continuous call mode, the floating ball should present a voice handling related form. This form needs to clearly express:

* The system is listening

* Current input method is voice

* User can continue speaking or end current input

Voice scenarios can include the following stages:

* Ready to receive

* Receiving

* Locked call

* Voice ended and transitioning to understanding or processing stage

### 4.2 Text Selection

When the user selects a segment of text, the floating ball should enter an operable prompt state related to the local text object. The system should express:

* Current selected text has been identified

* Currently can continue to collaborate centered on that local content

* User can click the floating ball or drag selected text to enter subsequent process

### 4.3 Text Drag

When the user drags text content to the floating ball, the system should clearly indicate that the currently being handled is dragged text, and enter intent confirmation or subsequent processing process after successful reception.

### 4.4 File Drag

When the user drags a file to the floating ball, the system should clearly indicate that the current task object is a file, and enter file parsing, intent confirmation, or subsequent processing process after reception. Compared to text drag, file drag usually has an additional transitional stage of parsing the file.

### 4.5 Hover Input

When the user hovers over the floating ball and enters lightweight input or views recommended questions, the system should enter a hover handling related form. This scenario emphasizes quick supplementation and low-cost collaboration, rather than complete conversation.

### 4.6 Intent Confirmation

When the system has identified the task object but still needs to judge what the user wants to do, it should enter the intent confirmation process. It is suggested to coordinate with the following interface structure:

* Bubble above floating ball: Displays the system's judgment of user intent

* Dialog box below floating ball: Provides confirmation button and allows user to input corrected intent

The goal of intent confirmation is to first confirm "what the user wants to do" before executing "how to generate results." The entire confirmation process should be as short as possible, avoiding making users feel that they have entered another round of complex conversation.

### 4.7 Result Return

When the system has completed lightweight processing and returned results, the floating ball should enter a result handling related form. This state needs to express:

* Current results are available

* User can view results

* User can continue to ask, confirm, or advance to the next action

### 4.8 Exception Handling

When input is incomplete, dragged object is unsupported, intent cannot be judged, task execution fails, or environment is unavailable, the floating ball should enter an exception related form. Exceptions can be further distinguished as:

* Light exception: Insufficient content, unclear intent, needs supplementation

* Execution failure: Task processing interrupted or failed

* Environment unavailable: Permission, network, or capability temporarily unavailable

* Recovery prompt: Prompt user on how to continue, such as retry, modification, or method switching

## 5. Operable Prompt State Supplement (This is the operable state triggered by left-click)

When the system identifies that an explicit task object already exists, such as the user has selected text, the floating ball can enter an operable prompt state to remind the user that they can currently continue to initiate collaboration centered on that object.

The visual presentation of this state does not need to be finalized at the current stage, and can be retained as: **Floating ball enters operable prompt state, specific visual style to be determined by subsequent visual design.**

The goals of the prompt state include:

* Let the user realize that the system has identified the current local object

* Prompt the user that they can continue to operate

* Do not disrupt the current reading and operation rhythm

When the task object becomes invalid, the user switches context, there is no subsequent operation for a long time, or the system judges that the current state is no longer suitable for continuing to prompt, the floating ball should exit this state and restore to default form.

## 6. Rhythm Control Supplement

In non-call mode, the system should both help users quickly initiate collaboration and avoid over-disturbance, so it is suggested to add overall rhythm control:

* Minimum cooldown time should exist between two adjacent proactive reminders

* Same type of reminder should not repeatedly appear within a short time

* When users continuously ignore reminders, automatically reduce reminder intensity or frequency

* When users continuously respond to reminders, moderately increase reminder positivity

* In static mode, the overall strategy should be obviously more restrained than active stay state

## 7. Design Principles

Around these non-entry interaction details, it is suggested to uniformly follow the following principles:

1. First judge state, then decide whether to remind

2. Light reminders first, strong reminders used sparingly

3. Short-term adjustable, long-term adaptive

4. Allow ignoring, do not force response

5. State clarity prioritizes visual richness

6. Interaction type clarity prioritizes animation complexity

## 8. Summary

Besides explicit interaction entries, the product also needs a set of supplementary mechanisms to control the floating ball's presence, proactive reminder rhythm, form changes, and intent confirmation methods.

The core functions of these mechanisms include:

* Reducing disturbance when users have no obvious behavior for a long time

* Moderately refreshing presence when users are active but briefly staying

* Entering lightweight intent confirmation process when task object is clear

* Adjusting overall disturbance intensity through reminder level and reminder frequency

* Expressing current state through system state forms and interaction handling forms

* Combining short-term feedback and long-term user profile to form proactive reminder strategies that better fit individuals

These mechanisms do not belong to the product interaction entries themselves, but will directly affect whether the overall experience is natural, restrained, and sustainable.

---

# Floating Ball Interaction Output Document (Draft)

## 1. Document Positioning

This document describes the **interaction output** in the floating ball system, that is, how the system finally delivers results to users after completing understanding, judgment, and execution.

The "interaction output" here does not discuss the interaction entry itself, nor does it replace the main interaction design document, but focuses on the following questions:

* Where are results finally delivered

* In what carrier are results presented

* How do users continue to use results

* How are lightweight feedback and formal delivery layered

In the floating ball system, interaction output is suggested to be divided into two layers:

* **Bubble-type handling method**: Used for immediate feedback, lightweight results, and single conversation handling

* **Action-type output method**: Used for real result delivery, determining the final form in which results are used by users

Among them, bubbles mainly assume lightweight handling and transitional roles; action-type output methods assume real delivery responsibilities.

---

## 2. Overall Principles of Interaction Output

### 2.1 Prioritize Delivery at Task Site

The system should prioritize completing result delivery near the user's current task site, minimizing unnecessary interface jumps and context switches.

### 2.2 Lightweight Feedback and Formal Delivery Layered

Not all results are suitable for directly entering documents, result pages, or dashboards. The system should first give lightweight feedback, then decide the final delivery method based on result nature.

### 2.3 Choose Output Based on Result Nature

The choice of interaction output should prioritize the nature of the result itself, rather than simply the trigger method.

### 2.4 Result Delivery Prioritizes Form Unification

Different task types can have different optimal outputs. The system should prioritize ensuring "results are correctly used" rather than forcibly unifying the presentation form of all results.

---

## 3. Two-Layer Structure of Interaction Output

### 3.1 Bubble-Type Handling Method

The bubble above the floating ball is the **lightweight conversation handling area** between users and Agent, mainly assuming the following responsibilities:

* Immediate feedback

* Status explanation

* Intent judgment

* Brief results

* Next step suggestions

* Short-link handling for single tasks

Bubbles are not traditional chat boxes, nor are they long-term result storage areas. Its core positioning is:

> Lightweight, temporary, recoverable, controllable task site conversation carrier.

### 3.2 Action-Type Output Method

Action-type output method is the **real delivery layer** of results, determining the final form in which results are received, viewed, continued to be edited, or continued to be advanced by users.

Action-type output methods can include:

* Write directly to bubble

* Open browser/result page

* Generate document in workspace and open

* Open generated file

* Open folder and highlight result

* Open task details/historical tasks

* Voice playback

---

## 4. Action-Type Output Methods

### 4.1 Write Directly to Bubble

The system can directly write results into the bubble above the floating ball as the most lightweight and immediate delivery method.

Suitable for carrying content including:

* Rewrite

* Completion

* Translation

* Formatting

* Insert text

* Local replacement

This method is applicable to the following situations:

* Content is short

* User currently needs to see results immediately

* No complex layout needed

* No need to additionally open new interfaces

* Results are mainly used for continued operation at the current task site

Writing directly to bubble is the default lightweight delivery method, but is not suitable for carrying results that are too long, strongly editable, or need long-term preservation.

### 4.2 Open Browser/Result Page

The system can deliver results to a browser page or independent result page.

Suitable for carrying content including:

* Search results

* Webpage task results

* Browsable, jumpable structured results

This method is applicable to the following situations:

* Results themselves have external link structures

* Users need to continue browsing, clicking, jumping

* Results are not final text products, but information collections or webpage task results

* Suitable for "summary + jumpable details" delivery mode

In this method, the bubble near the floating ball is more suitable as a pre-explanation, for example:

* Give a one-sentence summary

* Inform that the task is completed

* Inform that results will open in browser or result page

### 4.3 Generate Document in Workspace and Open

The system can generate a document in the workspace and automatically open the document for users to view and continue editing.

Document forms can include:

* Word

* PDF

* Markdown

Suitable for carrying content including:

* Drafts

* Summaries

* Email drafts

* Proposal drafts

* Long text content that can be continued to be edited

This method is applicable to the following situations:

* Results are long and not suitable for complete display in bubbles

* Content has strong editing value

* Users may subsequently need to continue modifying, copying, or saving

* Results themselves are already close to formal products

This is one of the main delivery methods for long text results.

### 4.4 Open Generated File

The system can directly open the generated target file.

Suitable for carrying content including:

* Already generated single target file

* Directly viewable result files

* Already converted or exported file products

This method is applicable to the following situations:

* System output is already an explicit file

* What users need most at this moment is to directly view file content

* The file itself is the delivery result, not an intermediate process

Compared to "generate document in workspace and open," this emphasizes more that "the file has already been generated and is directly opened as the final product."

### 4.5 Open Folder and Highlight Result

The system can directly open the target folder and highlight the result files generated this time.

Suitable for carrying content including:

* Exported files

* Reports

* Images

* Compressed packages

* Tables

* Multiple file products

This method is applicable to the following situations:

* Results are file-type products

* Users need to drag, move, send, or secondarily process files

* Results may be more than one file

* Users need to clearly know the file save location

This method is suitable as the main output for file delivery-type results.

### 4.6 Open Task Details/Historical Tasks

The system can deliver results to the task details page or historical task page.

Suitable for carrying content including:

* Review

* Recovery

* Continue processing

* Audit

* Failure diagnosis

This method is applicable to the following situations:

* Task has continuity

* Results need to be tracked

* Users may subsequently return to continue processing

* Need to view task process, historical versions, or failure reasons

This output is more suitable for continuous tasks and traceable tasks, rather than single lightweight delivery.

### 4.7 Voice Playback

The system can play results through voice.

This method has lower priority and is suitable for:

* Brief feedback

* Status notification

* Small amount of result reporting

Voice playback should not be the main delivery output, but is more suitable as a supplementary output method.

---

## 5. Selection Principles for Action-Type Output Methods

When the system chooses interaction output, it should prioritize the nature of the result, rather than simply judging by the trigger method.

### 5.1 Results Short and Immediate, Prioritize Bubble

Applicable to short text, local rewrite, translation, format adjustment, brief conclusions, and other results.

### 5.2 Results Browsable and Jumpable, Prioritize Browser or Result Page

Applicable to search results, webpage task results, structured information collections, and other content.

### 5.3 Results Need Editing or Long-term Preservation, Prioritize Workspace Document

Applicable to drafts, proposals, summaries, email drafts, and other long text results.

### 5.4 Results Themselves are Files, Prioritize Open File or Open Folder

Applicable to exported files, images, compressed packages, tables, reports, and other file-type products.

### 5.5 Results Have Continuity and Tracking Needs, Prioritize Task Details or Historical Tasks

Applicable to tasks that need review, recovery, continued advancement, or failure troubleshooting.

---

## 6. Bubble Responsibilities in Interaction Output

Bubbles are not responsible for handling all results, but are responsible for the following types of content:

### 6.1 Status-Type Output

Used to tell users what the system is currently doing, for example:

* Received

* Analyzing

* Identifying

* Generating

* Completed

* Error

* Needs confirmation

### 6.2 Judgment-Type Output

Used to tell users the system's current understanding and judgment, for example:

* Do you want to summarize this content

* Do you want to translate this file

* Output method is three-point summary

### 6.3 Lightweight Result-Type Output

Used to directly deliver shorter results, for example:

* A segment of rewrite

* A segment of completion

* A segment of translation

* Three key points

* A brief conclusion

### 6.4 Suggestion-Type Output

Used to prompt users what they might want to do next, for example:

* Whether to continue extracting

* Whether to change to email format

* Whether to write to document

* Whether to view details

Therefore, bubbles are more suitable as:

> Default lightweight output, pre-explanation area, and short result delivery area.

---

## 7. Bubble Details Supplement

Bubbles are the default lightweight handling carrier in the floating ball system, used to complete immediate feedback, single conversation handling, and lightweight result delivery near the current task site.

To avoid bubbles evolving into traditional chat interfaces, while ensuring their readability, controllability, and recoverability, it is suggested to supplement the following detailed rules.

### 7.1 Single Conversation Single Bubble

A continuous interaction generated by the user and floating ball around one explicit task object is regarded as one bubble.

"Single conversation" here emphasizes the continuous handling formed around the same object, the same round of intent confirmation, and result delivery, rather than stacking all historical content as multi-round chat records.

It is suggested to maintain the following principles:

* One explicit task object corresponds to one main bubble

* Same bubble can handle status feedback, intent judgment, and lightweight results

* Do not design bubbles as infinitely extended chat threads

### 7.2 Bubble Quantity Upper Limit

Bubbles retain at most three at the same time.

When a new bubble appears and the quantity exceeds three, the earliest appearing bubble begins to exit the current interface. Default priority is to eliminate the earliest appearing and unpinned bubble; if the earliest bubble is already pinned, continue searching backward for the earliest unpinned bubble.

The goals of this rule are:

* Control visual complexity near the floating ball

* Prevent lightweight handling area from evolving into chat list

* Maintain a fresh feeling at the current task site

* Let users always prioritize attention to the most recent results and feedback

### 7.3 Bubble Basic Structure

A complete bubble should at least contain the following areas:

* **Main content area**: Displays status, judgment, results, or suggestions

* **Top-left pin entry**: Used to retain important bubbles

* **Top-right delete entry**: Used to actively destroy the current bubble

* **Additional action area when necessary**: For example, lightweight operations such as "continue," "retry," "write to document," "view details"

It is suggested that the information hierarchy inside the bubble follows:

* First layer: Currently most important conclusion or feedback

* Second layer: Supplementary explanation or brief context

* Third layer: Next step suggestion or lightweight action

### 7.4 Bubble Content Boundary

Bubbles are suitable for handling the following content:

* One-sentence status feedback

* A segment of intent judgment

* A brief explanation

* A small segment of rewrite or translation results

* 3 to 5 short key points

* An explicit conclusion

* Next step suggestions

Bubbles are not suitable for handling the following content:

* Large segments of continuous long text

* Complex layout content

* Complete formal drafts

* Large tables

* Content that needs long-term preservation and continuous editing

* Multi-round continuous historical records

Therefore, the default responsibility of bubbles should always be:

> Lightweight handling, not complete storage.

### 7.5 Bubble Lifecycle

Ordinary bubbles are suggested to follow the following lifecycle:

1. **Manifestation state**

   * Bubble is completely visible
   
   * User can directly read and operate

2. **Transparency state**

   * If user has no new operations, bubble begins to slowly weaken presence
   
   * Visually gradually enters weak prompt state

3. **Hidden state**

   * Bubble is no longer completely manifested
   
   * But can still be re-invoked through mouse approach

4. **Dissipation state**

   * If there are still no new user operations after hiding, bubble completely exits the interface

It is suggested to default to using the progressive mechanism of "manifestation → transparency → hidden → dissipation," rather than sudden disappearance.

### 7.6 Bubble Time Mechanism

Regarding bubble time mechanism, it is suggested to at least clarify the following parameters:

* How many seconds after bubble appears to begin transparency

* How long transparency continues before entering hidden state

* Maximum retention time in hidden state

* Whether to reset timing after mouse moves back

* Whether pinned bubbles skip automatic dissipation process

Suggested rules are as follows:

* Ordinary bubbles: Follow complete lifecycle

* Mouse moves to bubble area in hidden state: Bubble re-manifests and resets timing

* Pinned bubbles: Do not enter automatic dissipation process, unless user actively unpin or actively delete

Parameters can be temporarily retained as undetermined in the document, for example:

* Bubble begins transparency **Xs** after appearing

* Dissipates **Xmin** after entering hidden state

### 7.7 Bubble Pin and Delete

Each bubble should provide two basic control actions:

* **Pin retain**: Fix the bubble in the current interface, not participating in automatic transparency, hiding, and dissipation

* **Delete destroy**: Immediately remove the current bubble from the interface

These two actions correspond to two types of user intent:

* "I want to keep this content to view"

* "I don't need this content anymore, make it disappear directly"

Suggested supplementary rules are as follows:

* Pinned bubbles should have clear visual distinction

* Delete action takes effect immediately, without hidden buffer

* Pinned bubbles can still be unpinned, restoring ordinary lifecycle

* If bubble is already pinned, it does not participate in automatic elimination after exceeding quantity upper limit

### 7.8 Bubble Recovery Mechanism

Bubbles in hidden state should not be regarded as completely disappeared, but should retain lightweight recoverability.

When the mouse moves to the bubble area after hidden state, the bubble re-manifests and restores to readable state. After re-manifestation, the bubble's display timing should be reset.

The goals of this mechanism are:

* Allow users to quickly retrieve recent results

* Reduce frustration of "bubble disappeared too quickly"

* Improve fault tolerance of lightweight result handling

### 7.9 Bubble and Result Diversion

When the content handled in the bubble exceeds its suitable range, the system should trigger diversion, rather than forcibly continuing to stack in the bubble.

Suggested diversion directions include:

* **Write to workspace document and open**: Suitable for long text, drafts, summaries, editable content

* **Open browser/result page**: Suitable for structured results, search results, webpage task results

* **Open generated file**: Suitable for single file products

* **Open folder and highlight result**: Suitable for file-type products, multiple file products

* **Open task details/historical tasks**: Suitable for continuous tasks, review, recovery, failure diagnosis

It is suggested that when diverting, the bubble still retains a brief sentence explanation, for example:

* Has written to document and opened for you

* Results have been generated, opening result page

* File has been exported, has located to save location

That is, the bubble is still responsible for "informing," and the formal output is responsible for "delivery."

### 7.10 Action Suggestions in Bubbles

Bubbles can carry a small amount of lightweight actions, but should control quantity, avoiding evolving into complex panels.

Suggested action types to retain include:

* Continue

* Retry

* Modify

* Write to document

* View details

* Open result

* Regenerate

Suggested limitation principles are as follows:

* Main actions in a single bubble should not be too many

* Prioritize presenting one main action, others as secondary actions

* Action naming should be as short, clear, and predictable as possible

* Action area should serve current results, not open new complex flows

### 7.11 Bubble Design Principles

Around bubble details, it is suggested to uniformly follow the following principles:

#### 7.11.1 Single Task Prioritizes Historical Stacking

Bubbles first serve the current task object, rather than assuming historical conversation recording functions.

#### 7.11.2 Recoverable Prioritizes Immediate Destruction

Ordinary bubbles should first enter hidden state, rather than disappearing directly.

#### 7.11.3 User-Controllable Prioritizes System Strong Recycling

Important bubbles should allow users to pin retain, rather than all being handed over to the system for automatic recycling.

#### 7.11.4 Result Delivery Prioritizes Visual Stay

The primary goal of bubbles is to help results be received, not to make them stay as long as possible.

#### 7.11.5 Lightweight Handling Prioritizes Complex Extension

When content or process exceeds bubble carrying capacity, it should naturally divert to documents, result pages, files, or task details, rather than making bubbles into complete workbenches.

---

## 8. Relationship Between Bubbles and Formal Delivery

Bubbles are not necessarily the final output, but are usually the **first output**.

Suggested default rhythm is as follows:

### Step 1: First Give Status Feedback

First tell the user that the system has received, is understanding, or is processing, avoiding users not knowing whether the system has responded.

### Step 2: Give Intent Judgment When Necessary

In scenarios where the task object is clear but intent still needs confirmation, first give system judgment through the bubble.

### Step 3: Deliver Lightweight Results or Pre-Explanation

If results are short, can be given directly in the bubble; if results are long or need further diversion, can first give summary or explanation through the bubble.

### Step 4: Enter Formal Output

According to result nature, enter the corresponding action-type output method:

* Workspace document

* Browser/result page

* Generated file

* Folder

* Task details/historical tasks

---

## 9. Relationship Between Interaction Output and Other Carriers

### 9.1 Relationship with Lightweight Dialog Box Below Floating Ball

The lightweight dialog box below the floating ball is not a main output area, but a lightweight input and control area, mainly responsible for:

* Confirmation

* Modification

* Supplement a sentence of input

* Upload attachments

* Trigger next step action

Therefore, the lightweight dialog box below mainly handles "actions," not "results."

### 9.2 Relationship with Workspace Documents

Workspace documents are the main handling output for long text, editable content, and saveable content.

When results are too long, unsuitable for placement in bubbles, or results themselves have strong editing value, the system should prioritize transferring to workspace documents.

### 9.3 Relationship with Dashboard

The dashboard is not the default output area, but the handling output for continuous tasks, complete workflows, and traceable tasks.

When tasks have continuity, need to view historical processes, or need to uniformly view multiple results, the system can further handle results to the dashboard or task details.

---

## 10. Interaction Output Design Principles

### 10.1 Prioritize Delivering Results, Not Opening Interfaces

The system should first solve "how results are used by users," then decide whether to open new interfaces.

### 10.2 Prioritize Reducing Context Switching

If delivery can be completed at the current task site, do not prioritize pulling users away from the current interface.

### 10.3 Lightweight Output First, Heavy Output as Needed

First complete lightweight handling through bubbles, then enter documents, result pages, files, or task details as needed.

### 10.4 Output Should Match Result Nature

Delivery method should serve the result itself, not serve a fixed process.

### 10.5 Allow Results to Naturally Divert from Lightweight Output to Formal Output

For example:

* Bubble first gives summary

* Then opens result page

* Then enters workspace document

* Then enters task details

This type of diversion is natural extension, not process fragmentation.

---

## 11. Summary

Interaction output in the floating ball system is suggested to be divided into two layers:

* **Bubble-type handling method**: Responsible for immediate feedback, lightweight conversation, short results, and transitional explanation

* **Action-type output method**: Responsible for real result delivery

Action-type output methods can include:

* Write directly to bubble

* Open browser/result page

* Generate document in workspace and open

* Open generated file

* Open folder and highlight result

* Open task details/historical tasks

* Voice playback

Among them, bubbles are not long-term result storage areas, nor traditional chat boxes, but lightweight conversation handling mechanisms around the floating ball.

The overall goal is: Without evolving into traditional chat interfaces, enable the floating ball to complete lightweight feedback, result explanation, and multi-type result delivery, and let users always prioritize completing result reception and subsequent processing at the current task site.
