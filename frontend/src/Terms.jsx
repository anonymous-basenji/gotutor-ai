// This is the terms of service page
import { React } from 'react';
import './Terms.css';

function Terms() {
    return(
        <div className="terms-container">
            <h1>Terms of Service</h1>
            <p className="effective-date">Effective Date: January 5, 2026</p>

            <section>
                <h2>1. Account Types and Eligibility</h2>
                <p>GoTutor.ai utilizes a supervised account structure. There are two tiers of access:</p>
                <ul>
                    <li><strong>Supervisor Accounts:</strong> Must be created and maintained by a natural person at least <strong>18 years of age</strong>. Supervisors are responsible for account management, billing, and oversight.</li>
                    <li><strong>Student Accounts:</strong> Subordinate accounts managed by a Supervisor. Student users may be minors or adults (e.g., college students), provided their access is authorized by the primary Supervisor.</li>
                </ul>
            </section>

            <section>
                <h2>2. Supervisor Responsibilities</h2>
                <p>By registering as a Supervisor, you represent and warrant that:</p>
                <ul>
                    <li>All registration information provided is truthful and accurate.</li>
                    <li>You are the parent, legal guardian, or authorized educational professional for any <strong>minor</strong> student linked to your account.</li>
                    <li>For <strong>adult</strong> students (18+), you have obtained their express consent to manage their account and monitor their educational data.</li>
                    <li>You assume full legal and financial responsibility for all actions taken by Student Accounts linked to your profile.</li>
                </ul>
            </section>

            <section>
                <h2>3. Nature of Service and AI Disclaimer</h2>
                <p>GoTutor.ai utilizes generative artificial intelligence to provide tutoring assistance.</p>
                <ul>
                    <li><strong>Accuracy:</strong> AI can produce inaccurate information or "hallucinations." GoTutor.ai does not guarantee the factual accuracy of AI-generated responses.</li>
                    <li><strong>Not a Substitute:</strong> This service is an educational aid and is not a substitute for professional human instruction.</li>
                    <li><strong>Oversight:</strong> The Supervisor assumes all risk for how Students interpret and apply the AI's output.</li>
                </ul>
            </section>

            <section>
                <h2>4. User Conduct</h2>
                <p>You agree not to use GoTutor.ai to generate harmful, illegal, or sexually explicit content. You may not attempt to reverse-engineer the AI or bypass safety filters. Misrepresenting your age to gain "Supervisor" privileges is a material breach of these Terms.</p>
            </section>

            <section>
                <h2>5. Limitation of Liability</h2>
                <p>To the maximum extent permitted by Florida law, GoTutor.ai, its founders, and affiliates shall not be liable for any indirect, incidental, or consequential damages arising from your use of the service.</p>
            </section>

            <section>
                <h2>6. Governing Law and Venue</h2>
                <p>These Terms shall be governed by and construed in accordance with the <strong>laws of the State of Florida</strong>.</p>
                <p><strong>Exclusive Venue:</strong> Exclusive jurisdiction for any legal action shall be the appropriate <strong>State or Federal courts located in Volusia County, Florida</strong>. You hereby waive any objection to the laying of venue in such courts.</p>
            </section>

            <section>
                <h2>7. Contact Information</h2>
                <p>Questions regarding these Terms should be directed to: <strong>andrew.v.sklyarov@gmail.com</strong></p>
            </section>
        </div>
    );
}

export default Terms;