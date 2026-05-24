import axios from "axios";

// Use relative path for deployment compatibility
const API = "/api/ai";

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