import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabase";

const RUNNER_SRC = `${import.meta.env.BASE_URL}runner.png`;

function getRemainingSteps(runner) {
  return runner.goal_steps - runner.current_steps;
}

function getCompletionRate(runner) {
  if (!runner.goal_steps) return 0;
  return (runner.current_steps / runner.goal_steps) * 100;
}

function formatRemaining(value) {
  if (value >= 0) return `${value.toLocaleString()}보`;
  return `초과 ${Math.abs(value).toLocaleString()}보`;
}

function sortByCurrentSteps(runners) {
  return [...runners].sort((a, b) => {
    if (b.current_steps !== a.current_steps) {
      return b.current_steps - a.current_steps;
    }
    return a.id - b.id;
  });
}

export default function App() {
  const [search, setSearch] = useState("");
  const [runners, setRunners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminMode, setAdminMode] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setAdminMode(params.get("admin") === "1");
  }, []);

  useEffect(() => {
    fetchParticipants();

    const channel = supabase
      .channel("participants-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "participants" },
        () => {
          fetchParticipants();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchParticipants() {
    setLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("participants")
      .select("*")
      .order("current_steps", { ascending: false });

    console.log("불러온 데이터:", data, error);

    if (error) {
      console.error("데이터 조회 오류:", error);
      setErrorMessage("Supabase 데이터를 불러오는 중 오류가 발생했습니다.");
      setRunners([]);
    } else {
      setRunners(data || []);
    }

    setLoading(false);
  }

  async function updateRunner(id, goalSteps, currentSteps) {
    const { error } = await supabase
      .from("participants")
      .update({
        goal_steps: Number(goalSteps) || 0,
        current_steps: Number(currentSteps) || 0,
      })
      .eq("id", id);

    if (error) {
      console.error("업데이트 오류:", error);
      alert("수정 중 오류가 발생했습니다.");
    }
  }

  const sorted = useMemo(() => sortByCurrentSteps(runners), [runners]);
  const leader = sorted[0];

  const totalCurrentSteps = sorted.reduce(
    (sum, runner) => sum + runner.current_steps,
    0
  );
  const totalRemainingSteps = sorted.reduce(
    (sum, runner) => sum + getRemainingSteps(runner),
    0
  );
  const averageCompletion =
    sorted.length > 0
      ? sorted.reduce((sum, runner) => sum + getCompletionRate(runner), 0) /
        sorted.length
      : 0;

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return sorted;
    return sorted.filter((runner) =>
      runner.name.toLowerCase().includes(keyword)
    );
  }, [search, sorted]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          padding: 40,
          background: "linear-gradient(180deg, #f6efe4 0%, #eee1cc 50%, #e5d6bf 100%)",
          fontFamily: 'Arial, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif',
          color: "#1f2937",
        }}
      >
        데이터를 불러오는 중입니다.
      </div>
    );
  }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        body {
          margin: 0;
          font-family: Arial, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif;
          background: linear-gradient(180deg, #f6efe4 0%, #eee1cc 50%, #e5d6bf 100%);
          color: #1f2937;
        }
        .page {
          min-height: 100vh;
          padding: 24px;
        }
        .container {
          max-width: 1500px;
          margin: 0 auto;
        }
        .header {
          background: white;
          border-radius: 28px;
          padding: 28px;
          box-shadow: 0 12px 32px rgba(15, 23, 42, 0.08);
          margin-bottom: 20px;
        }
        .title {
          margin: 0 0 10px 0;
          text-align: center;
          font-size: 42px;
          font-weight: 900;
        }
        .subtitle {
          margin: 0;
          text-align: center;
          color: #6b7280;
          font-size: 17px;
          line-height: 1.7;
        }
        .adminBanner {
          margin-top: 14px;
          background: #fff7ed;
          color: #9a3412;
          border: 1px solid #fdba74;
          padding: 12px 16px;
          border-radius: 14px;
          font-size: 14px;
          text-align: center;
          font-weight: 700;
        }
        .errorBanner {
          margin-top: 14px;
          background: #fef2f2;
          color: #b91c1c;
          border: 1px solid #fca5a5;
          padding: 12px 16px;
          border-radius: 14px;
          font-size: 14px;
          text-align: center;
          font-weight: 700;
        }
        .layout {
          display: grid;
          grid-template-columns: 1.6fr 0.95fr;
          gap: 20px;
        }
        .card {
          background: white;
          border-radius: 28px;
          padding: 20px;
          box-shadow: 0 12px 32px rgba(15, 23, 42, 0.08);
        }
        .stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 18px;
        }
        .statBox {
          background: #f8fafc;
          border-radius: 18px;
          padding: 18px;
        }
        .statLabel {
          font-size: 13px;
          color: #64748b;
          margin-bottom: 10px;
        }
        .statValue {
          font-size: 26px;
          font-weight: 900;
          line-height: 1.25;
        }
        .trackWrap {
          background: linear-gradient(180deg, #bde8bd 0%, #9ce0a2 100%);
          border-radius: 26px;
          padding: 16px;
          border: 1px solid #a8dfb0;
          margin-bottom: 18px;
        }
        .trackHeader {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 14px;
          flex-wrap: wrap;
        }
        .trackTitle {
          font-size: 18px;
          font-weight: 900;
        }
        .trackBadge {
          background: rgba(255,255,255,0.8);
          padding: 9px 14px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 800;
        }
        .track {
          background: linear-gradient(180deg, #73d978 0%, #59ca61 100%);
          border-radius: 22px;
          padding: 12px;
        }
        .lane {
          position: relative;
          height: 84px;
          margin-bottom: 6px;
          border-radius: 999px;
          background: rgba(255,255,255,0.11);
        }
        .lane:last-child {
          margin-bottom: 0;
        }
        .lane::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          top: 50%;
          border-top: 1px dashed rgba(255,255,255,0.34);
          transform: translateY(-50%);
        }
        .runner {
          position: absolute;
          top: 50%;
          transform: translate(-50%, -50%);
          transition: left 0.6s ease;
          text-align: center;
        }
        .runnerLabel {
          position: absolute;
          bottom: 72px;
          left: 50%;
          transform: translateX(-50%);
          white-space: nowrap;
          font-size: 10px;
          font-weight: 800;
          background: rgba(17,24,39,0.85);
          color: white;
          padding: 4px 9px;
          border-radius: 999px;
        }
        .runnerSpriteWrap {
          width: 64px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
          filter: drop-shadow(0 4px 12px rgba(0,0,0,0.18));
          animation: bounce 0.65s infinite ease-in-out;
        }
        .runnerSprite {
          width: 64px;
          height: 64px;
          object-fit: contain;
          user-select: none;
          pointer-events: none;
        }
        .leaderTag {
          position: absolute;
          bottom: 104px;
          left: 50%;
          transform: translateX(-50%);
          white-space: nowrap;
          font-size: 10px;
          font-weight: 900;
          background: #ffd43b;
          color: #3f2f00;
          padding: 4px 9px;
          border-radius: 999px;
        }
        @keyframes bounce {
          0% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
          100% { transform: translateY(0); }
        }
        .rankingSearch {
          margin-bottom: 12px;
        }
        input {
          width: 100%;
          border: 1px solid #d1d5db;
          border-radius: 14px;
          padding: 12px;
          font-size: 14px;
        }
        .rankingList {
          max-height: 1180px;
          overflow: auto;
          padding-right: 4px;
        }
        .rankCard {
          border: 1px solid #e5e7eb;
          border-radius: 20px;
          padding: 15px;
          margin-bottom: 12px;
          background: white;
        }
        .rankCard.leader {
          background: #fff9db;
          border-color: #ffd43b;
        }
        .rankTop {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: flex-start;
        }
        .rankLeft {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }
        .rankNo {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          flex-shrink: 0;
          background: #6366f1;
        }
        .rankName {
          font-weight: 900;
          margin-bottom: 4px;
          font-size: 18px;
        }
        .rankGap {
          font-size: 13px;
          color: #6b7280;
        }
        .rateBadge {
          min-width: 86px;
          text-align: right;
        }
        .ratePercent {
          font-size: 22px;
          font-weight: 900;
          line-height: 1;
        }
        .rateLabel {
          font-size: 12px;
          color: #6b7280;
          margin-top: 4px;
        }
        .infoGrid {
          margin-top: 14px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }
        .infoBox {
          background: #f8fafc;
          border-radius: 14px;
          padding: 12px;
        }
        .infoLabel {
          font-size: 12px;
          color: #64748b;
          margin-bottom: 6px;
        }
        .infoValue {
          font-size: 17px;
          font-weight: 900;
        }
        .adminPanel {
          margin-top: 18px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 22px;
          padding: 18px;
        }
        .adminTitle {
          margin-top: 0;
          margin-bottom: 12px;
          font-size: 20px;
          font-weight: 900;
        }
        .adminGrid {
          display: grid;
          gap: 10px;
          max-height: 520px;
          overflow: auto;
        }
        .adminRow {
          display: grid;
          grid-template-columns: 70px 1fr 140px 140px 90px;
          gap: 8px;
          align-items: center;
        }
        .adminCell {
          background: #f8fafc;
          border-radius: 12px;
          padding: 10px 12px;
          font-size: 14px;
          font-weight: 700;
        }
        .saveBtn {
          border: 0;
          border-radius: 12px;
          padding: 10px 12px;
          background: #4f46e5;
          color: white;
          font-weight: 700;
          cursor: pointer;
        }

        @media (max-width: 1200px) {
          .layout {
            grid-template-columns: 1fr;
          }
          .stats {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 720px) {
          .page {
            padding: 12px;
          }
          .title {
            font-size: 30px;
          }
          .subtitle {
            font-size: 14px;
          }
          .stats {
            grid-template-columns: 1fr;
          }
          .infoGrid {
            grid-template-columns: 1fr;
          }
          .lane {
            height: 90px;
          }
          .runnerSpriteWrap {
            width: 58px;
            height: 58px;
          }
          .runnerSprite {
            width: 58px;
            height: 58px;
          }
          .runnerLabel {
            bottom: 68px;
          }
          .leaderTag {
            bottom: 98px;
          }
          .adminRow {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="page">
        <div className="container">
          <div className="header">
            <h1 className="title">유일하이스트 시즌8 챌린지</h1>
            <p className="subtitle">
              총 {sorted.length}명이 참여 중인 챌린지입니다. 현재 걸음 수 기준으로 순위가 자동 반영되며,
              각 참여자의 목표 걸음 수, 현재 걸음 수, 남은 걸음 수 및 달성률을 한눈에 확인하실 수 있습니다.
            </p>

            {adminMode && (
              <div className="adminBanner">
                관리자 수정 모드입니다. 현재 걸음 수를 수정하면 순위와 이름 위치가 자동으로 다시 정렬됩니다.
              </div>
            )}

            {errorMessage && (
              <div className="errorBanner">
                {errorMessage}
              </div>
            )}
          </div>

          <div className="layout">
            <div>
              <div className="card">
                <div className="stats">
                  <div className="statBox">
                    <div className="statLabel">참가자 수</div>
                    <div className="statValue">{sorted.length}명</div>
                  </div>

                  <div className="statBox">
                    <div className="statLabel">현재 1위</div>
                    <div className="statValue" style={{ fontSize: "24px" }}>
                      {leader ? leader.name : "-"}
                    </div>
                  </div>

                  <div className="statBox">
                    <div className="statLabel">총 현재 걸음 수</div>
                    <div className="statValue">{totalCurrentSteps.toLocaleString()}보</div>
                  </div>

                  <div className="statBox">
                    <div className="statLabel">평균 달성률</div>
                    <div className="statValue">{averageCompletion.toFixed(1)}%</div>
                  </div>
                </div>

                <div className="trackWrap">
                  <div className="trackHeader">
                    <div className="trackTitle">실시간 레이스 트랙</div>
                    <div className="trackBadge">
                      총 남은 걸음 수 {totalRemainingSteps.toLocaleString()}보
                    </div>
                  </div>

                  <div className="track">
                    {sorted.map((runner, index) => {
                      const completion = getCompletionRate(runner);
                      const progress = Math.max(5, Math.min(96, completion));

                      return (
                        <div className="lane" key={runner.id}>
                          <div className="runner" style={{ left: `${progress}%` }}>
                            {index === 0 && <div className="leaderTag">1위</div>}
                            <div className="runnerLabel">
                              {index + 1}위 · {runner.name} · {completion.toFixed(1)}%
                            </div>

                            <div
                              className="runnerSpriteWrap"
                              title={`${runner.name} / 현재 ${runner.current_steps.toLocaleString()}보 / 남은 ${formatRemaining(getRemainingSteps(runner))}`}
                            >
                              <img
                                className="runnerSprite"
                                src={RUNNER_SRC}
                                alt={`${runner.name} 러너 캐릭터`}
                                loading="lazy"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {adminMode && (
                  <div className="adminPanel">
                    <h3 className="adminTitle">관리자 수정</h3>
                    <div className="adminGrid">
                      {sorted.map((runner, index) => (
                        <AdminRow
                          key={runner.id}
                          runner={runner}
                          index={index}
                          onSave={updateRunner}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="card">
              <h3 style={{ marginTop: 0 }}>실시간 순위</h3>

              <div className="rankingSearch">
                <input
                  type="text"
                  placeholder="이름 검색"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="rankingList">
                {filtered.map((runner, index) => {
                  const remaining = getRemainingSteps(runner);
                  const completion = getCompletionRate(runner);
                  const gap = leader ? leader.current_steps - runner.current_steps : 0;

                  return (
                    <div
                      key={runner.id}
                      className={`rankCard ${index === 0 ? "leader" : ""}`}
                    >
                      <div className="rankTop">
                        <div className="rankLeft">
                          <div className="rankNo">{index + 1}</div>
                          <div>
                            <div className="rankName">{runner.name}</div>
                            <div className="rankGap">
                              {index === 0 ? "현재 선두" : `1위와 ${gap.toLocaleString()}보 차이`}
                            </div>
                          </div>
                        </div>

                        <div className="rateBadge">
                          <div className="ratePercent">{completion.toFixed(1)}%</div>
                          <div className="rateLabel">달성률</div>
                        </div>
                      </div>

                      <div className="infoGrid">
                        <div className="infoBox">
                          <div className="infoLabel">목표 걸음 수</div>
                          <div className="infoValue">{runner.goal_steps.toLocaleString()}보</div>
                        </div>
                        <div className="infoBox">
                          <div className="infoLabel">현재 걸음 수</div>
                          <div className="infoValue">{runner.current_steps.toLocaleString()}보</div>
                        </div>
                        <div className="infoBox">
                          <div className="infoLabel">남은 걸음 수</div>
                          <div className="infoValue">{formatRemaining(remaining)}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function AdminRow({ runner, index, onSave }) {
  const [goalSteps, setGoalSteps] = useState(runner.goal_steps);
  const [currentSteps, setCurrentSteps] = useState(runner.current_steps);

  useEffect(() => {
    setGoalSteps(runner.goal_steps);
    setCurrentSteps(runner.current_steps);
  }, [runner.goal_steps, runner.current_steps]);

  return (
    <div className="adminRow">
      <div className="adminCell">{index + 1}위</div>
      <div className="adminCell">{runner.name}</div>
      <input
        type="number"
        value={goalSteps}
        onChange={(e) => setGoalSteps(e.target.value)}
      />
      <input
        type="number"
        value={currentSteps}
        onChange={(e) => setCurrentSteps(e.target.value)}
      />
      <button
        className="saveBtn"
        onClick={() => onSave(runner.id, goalSteps, currentSteps)}
      >
        저장
      </button>
    </div>
  );
}