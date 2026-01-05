// This is the terms of service page
import { React } from 'react';
import './Terms.css';

function Terms() {
    return(
        <div className="terms-container">
            <h1>Terms of Service</h1>
            <p><strong>Effective Date: January 5, 2026</strong></p>

            <section>
                <h2>1. Eligibility and Supervisor Accounts</h2>
                <p>GoTutor.ai offers specialized tools for educational supervision. To create a "Supervisor" account, you must be a natural person at least <strong>18 years of age</strong>.</p>
                <p>By registering, you represent and warrant that:</p>
                <ul>
                <li>All registration information provided is truthful and accurate.</li>
                <li>You are the parent, legal guardian, or an authorized educational professional with the legal right to monitor the minor(s) linked to your account.</li>
                <li>You will not allow any minor to access the service without your direct oversight and consent.</li>
                </ul>
            </section>

            <section>
                <h2>2. Nature of Service and AI Disclaimer</h2>
                <p>GoTutor.ai utilizes generative artificial intelligence to provide tutoring assistance.</p>
                <ul>
                <li><strong>Accuracy:</strong> AI can produce inaccurate information or "hallucinations." GoTutor.ai does not guarantee the factual accuracy of AI-generated responses.</li>
                <li><strong>Not a Substitute:</strong> This service is an educational aid and is not a substitute for professional human instruction.</li>
                <li><strong>Supervisor Responsibility:</strong> The Supervisor assumes all risk for the interpretation and application of the AI's output.</li>
                </ul>
            </section>

            <section>
                <h2>3. User Conduct</h2>
                <p>You agree not to use GoTutor.ai to generate harmful, illegal, or sexually explicit content. You may not attempt to reverse-engineer the AI or bypass safety filters. Misrepresenting your identity or age to gain "Supervisor" privileges is a material breach of these Terms.</p>
            </section>

            <section>
                <h2>4. Account Termination</h2>
                <p>We reserve the right to suspend or terminate your account immediately, without notice or refund, if we believe you have provided false information regarding your age or have violated any part of these Terms.</p>
            </section>

            <section>
                <h2>5. Limitation of Liability</h2>
                <p>To the maximum extent permitted by Florida law, GoTutor.ai, its founders, and affiliates shall not be liable for any indirect, incidental, or consequential damages arising from your use of the service.</p>
            </section>

            <section>
                <h2>6. Governing Law and Venue</h2>
                <p>These Terms shall be governed by and construed in accordance with the <strong>laws of the State of Florida</strong>.</p>
                <p><strong>Exclusive Venue:</strong> You and GoTutor.ai expressly agree that the exclusive jurisdiction and venue for any legal action, suit, or proceeding arising out of or relating to these Terms shall be the appropriate <strong>State or Federal courts located in Volusia County, Florida</strong>. You hereby waive any objection to the laying of venue in such courts.</p>
            </section>

            <section>
                <h2>7. Contact Information</h2>
                <p>If you have questions regarding these Terms, please contact us at andrew.v.sklyarov@gmail.com.</p>
            </section>
        </div>
    );
}

export default Terms;