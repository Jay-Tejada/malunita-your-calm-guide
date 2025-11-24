interface DailyIntelligenceProps {
  summary?: string | null;
  quickWins?: Array<{ id: string; title: string }>;
}

export function DailyIntelligence({ summary, quickWins }: DailyIntelligenceProps) {
  // Render nothing if no data
  if (!summary && (!quickWins || quickWins.length === 0)) {
    return null;
  }

  return (
    <div 
      className="w-full flex justify-center"
      style={{ marginTop: "16px" }}
    >
      <div style={{ maxWidth: "760px", width: "100%" }}>
        {/* Today's Overview Section */}
        {summary && (
          <div style={{ marginBottom: "24px" }}>
            <h3 
              style={{ 
                color: "#3B352B",
                fontSize: "15px",
                fontWeight: 600,
                marginBottom: "8px"
              }}
            >
              Today's Overview
            </h3>
            <div 
              style={{ 
                color: "#6F6556",
                fontSize: "14px",
                lineHeight: "1.6",
                whiteSpace: "pre-wrap"
              }}
            >
              {summary}
            </div>
          </div>
        )}

        {/* Quick Wins Section */}
        {quickWins && quickWins.length > 0 && (
          <div>
            <h3 
              style={{ 
                color: "#3B352B",
                fontSize: "15px",
                fontWeight: 600,
                marginBottom: "8px"
              }}
            >
              Quick Wins
            </h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {quickWins.map((win) => (
                <li 
                  key={win.id}
                  style={{ 
                    color: "#6F6556",
                    fontSize: "14px",
                    marginBottom: "6px",
                    paddingLeft: "16px",
                    position: "relative"
                  }}
                >
                  <span 
                    style={{ 
                      position: "absolute",
                      left: 0,
                      top: 0
                    }}
                  >
                    •
                  </span>
                  {win.title}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
