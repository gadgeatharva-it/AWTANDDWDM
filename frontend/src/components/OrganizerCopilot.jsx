import React, { useState } from "react";
import { organizerCopilotAPI } from "../services/aiService";

const OrganizerCopilot = ({ organizerId }) => {
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const askAI = async () => {
    setLoading(true);

    try {
      const res = await organizerCopilotAPI(
        question,
        organizerId
      );

      setResponse(res.reply);
    } catch (error) {
      console.log(error);
    }

    setLoading(false);
    };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-4">
        Organizer Insights Copilot
      </h2>

      <textarea
        className="w-full border rounded-lg p-3"
        rows="4"
        placeholder="Ask analytics questions..."
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
      />

      <button
        onClick={askAI}
        className="mt-4 bg-black text-white px-6 py-2 rounded-lg"
      >
        Generate Insights
      </button>
       {loading && <p className="mt-4">Analyzing...</p>}

      {response && (
        <div className="mt-5 bg-gray-100 p-4 rounded-lg whitespace-pre-wrap">
          {response}
        </div>
      )}
    </div>
  );
};

export default OrganizerCopilot;