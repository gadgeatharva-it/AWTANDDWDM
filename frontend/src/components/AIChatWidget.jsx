import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function AIChatWidget() {

  const [open, setOpen] = useState(false);

  const { user } = useAuth();

  // MOBILE CHECK
  const isMobile = window.innerWidth < 768;

  const organizerWelcome =
    'Hello Organizer 👋 I can analyze attendance, revenue, and marketing for your events. Ask for insights, or type "summary" for a quick overview.';

  const attendeeWelcome =
    'Hello 👋 Ask me about events.';

  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: attendeeWelcome,
    },
  ]);

  // ROLE-BASED WELCOME MESSAGE

  useEffect(() => {

    if (!user) return;

    if (!messages || messages.length !== 1) return;

    if (messages[0].sender !== 'ai') return;

    const desired =
      user.role === 'organiser'
        ? organizerWelcome
        : attendeeWelcome;

    if (messages[0].text !== desired) {
      setMessages([
        {
          sender: 'ai',
          text: desired,
        },
      ]);
    }

  }, [user]);

  const [input, setInput] = useState('');

  const [loading, setLoading] = useState(false);

  //
  // SEND MESSAGE
  //

  const sendMessage = async () => {

    if (!input.trim()) return;

    const userMessage = {
      sender: 'user',
      text: input,
    };

    // ADD USER MESSAGE

    setMessages((prev) => [
      ...prev,
      userMessage,
    ]);

    const userInput = input;

    setInput('');

    setLoading(true);

    try {

      const endpoint =
        user?.role === 'organiser'
          ? 'http://localhost:5000/api/ai/organizer-copilot'
          : 'http://localhost:5000/api/ai/attendee-chat';

      const payload =
        user?.role === 'organiser'
          ? {
              message: userInput,
              organizerId: user.id,
            }
          : {
              message: userInput,
            };

      const res = await axios.post(
        endpoint,
        payload
      );

      const aiReply = {
        sender: 'ai',
        text: res.data.reply,
      };

      setMessages((prev) => [
        ...prev,
        aiReply,
      ]);

    } catch (error) {

      console.error(error);

      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: 'AI server error.',
        },
      ]);

    }

    setLoading(false);
  };

  //
  // ENTER KEY SUPPORT
  //

  const handleKeyDown = (e) => {

    if (e.key === 'Enter') {
      sendMessage();
    }

  };

  return (

    <div
      style={{
        position: 'fixed',

        bottom: isMobile ? '10px' : '20px',

        right: isMobile ? '10px' : '20px',

        zIndex: 99999,
      }}
    >

      {/* CHAT BUTTON */}

      {!open && (

        <button
          onClick={() => setOpen(true)}
          style={{
            width: isMobile ? '55px' : '60px',

            height: isMobile ? '55px' : '60px',

            borderRadius: '50%',

            border: 'none',

            background: '#000',

            color: '#fff',

            fontSize: '24px',

            cursor: 'pointer',

            boxShadow:
              '0 8px 24px rgba(0,0,0,0.2)',
          }}
        >
          🤖
        </button>

      )}

      {/* CHAT WINDOW */}

      {open && (

        <div
          style={{
            width:
              isMobile
                ? '95vw'
                : '360px',

            height:
              isMobile
                ? '90vh'
                : '550px',

            background: '#fff',

            borderRadius:
              isMobile
                ? '16px'
                : '20px',

            boxShadow:
              '0 10px 30px rgba(0,0,0,0.2)',

            display: 'flex',

            flexDirection: 'column',

            overflow: 'hidden',
          }}
        >

          {/* HEADER */}

          <div
            style={{
              background: '#000',

              color: '#fff',

              padding:
                isMobile
                  ? '14px'
                  : '16px',

              display: 'flex',

              justifyContent: 'space-between',

              alignItems: 'center',
            }}
          >

            <h3
              style={{
                margin: 0,

                fontSize:
                  isMobile
                    ? '16px'
                    : '18px',
              }}
            >
              {
                user?.role === 'organiser'
                  ? 'Organizer Insights Copilot'
                  : 'EventFlow AI'
              }
            </h3>

            <button
              onClick={() => setOpen(false)}
              style={{
                background: 'transparent',

                border: 'none',

                color: '#fff',

                fontSize: '24px',

                cursor: 'pointer',
              }}
            >
              ×
            </button>

          </div>

          {/* CHAT MESSAGES */}

          <div
            style={{
              flex: 1,

              padding:
                isMobile
                  ? '12px'
                  : '16px',

              overflowY: 'auto',

              background: '#f5f5f5',
            }}
          >

            {messages.map((msg, index) => (

              <div
                key={index}
                style={{
                  display: 'flex',

                  justifyContent:
                    msg.sender === 'user'
                      ? 'flex-end'
                      : 'flex-start',

                  marginBottom: '12px',
                }}
              >

                <div
                  style={{

                    maxWidth:
                      isMobile
                        ? '90%'
                        : '80%',

                    padding:
                      isMobile
                        ? '10px'
                        : '12px',

                    borderRadius: '14px',

                    background:
                      msg.sender === 'user'
                        ? '#000'
                        : '#fff',

                    color:
                      msg.sender === 'user'
                        ? '#fff'
                        : '#000',

                    boxShadow:
                      '0 2px 8px rgba(0,0,0,0.08)',

                    whiteSpace: 'pre-line',

                    lineHeight: '1.6',

                    fontSize:
                      isMobile
                        ? '14px'
                        : '15px',

                    wordBreak: 'break-word',
                  }}
                >
                  {msg.text}
                </div>

              </div>

            ))}

            {loading && (

              <div
                style={{
                  fontSize: '14px',
                  color: '#666',
                }}
              >
                AI is typing...
              </div>

            )}

          </div>

          {/* INPUT AREA */}

          <div
            style={{
              padding:
                isMobile
                  ? '10px'
                  : '12px',

              borderTop:
                '1px solid #ddd',

              display: 'flex',

              gap:
                isMobile
                  ? '8px'
                  : '10px',

              background: '#fff',
            }}
          >

            <input
              type="text"

              placeholder="Ask about events..."

              value={input}

              onChange={(e) =>
                setInput(e.target.value)
              }

              onKeyDown={handleKeyDown}

              style={{
                flex: 1,

                padding:
                  isMobile
                    ? '10px'
                    : '12px',

                borderRadius: '10px',

                border:
                  '1px solid #ccc',

                outline: 'none',

                fontSize:
                  isMobile
                    ? '14px'
                    : '15px',

                minWidth: 0,
              }}
            />

            <button
              onClick={sendMessage}

              disabled={loading}

              style={{
                padding:
                  isMobile
                    ? '10px 14px'
                    : '12px 16px',

                border: 'none',

                background: '#000',

                color: '#fff',

                borderRadius: '10px',

                cursor: 'pointer',

                fontSize:
                  isMobile
                    ? '14px'
                    : '15px',

                whiteSpace: 'nowrap',
              }}
            >
              Send
            </button>

          </div>

        </div>

      )}

    </div>

  );
}