import axios from "axios";

const API = "http://localhost:5000/api/ai";

export const attendeeChatAPI = async (message) => {
  const res = await axios.post(`${API}/attendee-chat`, {
    message
  });

  return res.data;
};

export const organizerCopilotAPI = async (
  message,
  organizerId
) => {
  const res = await axios.post(`${API}/organizer-copilot`, {
    message,
    organizerId
    });

  return res.data;
};