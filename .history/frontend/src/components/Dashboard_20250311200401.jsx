"use client";

import { useState, useRef, useEffect } from "react";
import { Command, Send, Users, Moon, Sun } from "lucide-react";
import "./dashboard.css";

export default function Dashboard() {
  const [command, setCommand] = useState("");
  const [outputs, setOutputs] = useState([]);
  const [totalUsers, setTotalUsers] = useState(125);
  const [activeUsers, setActiveUsers] = useState(42);
  const [darkMode, setDarkMode] = useState(false);
  const outputRef = useRef(null);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const processCommand = (cmd) => {
    if (!cmd.trim()) return;
    
    const responses = {
      help: "Available commands: help, clear, status, users",
      clear: "Clearing output...",
      status: "All systems operational",
      users: `Total users: ${totalUsers}, Active users: ${activeUsers}`,
      theme: `Theme switched to ${darkMode ? "dark" : "light"} mode`,
    };

    const output = responses[cmd.toLowerCase()] || `Command '${cmd}' not recognized`;

    const newOutput = {
      id: Date.now().toString(),
      command: cmd,
      output,
      timestamp: new Date(),
    };

    setOutputs((prev) => [...prev, newOutput]);
    setCommand("");

    if (cmd.toLowerCase() === "clear") {
      setTimeout(() => {
        setOutputs([]);
      }, 500);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    processCommand(command);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveUsers((prev) => {
        const change = Math.floor(Math.random() * 5) - 2;
        return Math.max(1, prev + change);
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [outputs]);

  return (
    <div className={`dashboard-container ${darkMode ? "dark" : ""}`}>
      <div className="dashboard-header">
        <h1>Command Dashboard</h1>
        <div className="user-stats">
          <div className="user-counter">
            <Users size={16} />
            <div className="user-numbers">
              <div className="total-users">Total: {totalUsers}</div>
              <div className="active-users">Active: {activeUsers}</div>
            </div>
          </div>
          <button className="theme-toggle" onClick={toggleDarkMode}>
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </div>
      <div className="output-card">
        <div ref={outputRef} className="output-display">
          {outputs.length === 0 ? (
            <div className="empty-state">
              <Command size={48} />
              <p>Enter a command to get started</p>
              <p className="hint">Try typing "help" for available commands</p>
            </div>
          ) : (
            outputs.map((item) => (
              <div key={item.id} className="output-item">
                <div className="command-line">
                  <span className="prompt">$</span>
                  <span className="command-text">{item.command}</span>
                  <span className="timestamp">{item.timestamp.toLocaleTimeString()}</span>
                </div>
                <div className="response-text">{item.output}</div>
              </div>
            ))
          )}
        </div>
      </div>
      <form onSubmit={handleSubmit} className="command-form">
        <div className="input-container">
          <input
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Enter command..."
            className="command-input"
            autoComplete="off"
          />
          <button
            type="submit"
            className={`submit-button ${!command.trim() ? "disabled" : ""}`}
            disabled={!command.trim()}
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}
