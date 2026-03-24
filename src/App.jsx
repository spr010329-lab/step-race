import { useMemo, useState } from "react";

const RUNNER_SRC = `${import.meta.env.BASE_URL}runner.png`;

const initialData = `1	대리 신진휴	609422	338675	270747
2	차장 이규범	560670	333075	227595
3	변리사 정의환	636050	328777	307273
4	차장 한은영	508414	299476	208938
5	변리사 백지석	621115	268869	352246
6	대리 윤정원	625223	259713	365510
7	사원 오준성	459248	255706	203542
8	사원 임예솔	510364	242040	268324
9	변리사 유재춘	313810	227298	86512
10	차장 정선미	395367	208542	186825
11	부장 김승규	305880	206243	99637
12	변리사 송해모	457757	206116	251641
13	변리사 이주원	388808	206004	182804
14	부장 장진영	401093	204032	197061
15	대리 김지수	331081	202284	128797
16	차장 황지현	374635	200421	174214
17	변리사 윤수인	400959	200356	200603
18	부장 장혁재	377229	197979	179250
19	변리사 이석빈	381733	195670	186063
20	부장 김수철	511580	192978	318602
21	변리사 박가연	382218	187404	194814
22	과장 조미옥	626485	181483	445002
23	대리 이윤서	388276	176886	211390
24	변리사 이유진	400000	170733	229267
25	부장 임현진	331163	166159	165004
26	대리 임중혁	463547	164354	299193
27	차장 이민영	406697	162351	244346
28	대리 이주혜	424623	155387	269236
29	사원 김채희	514405	153707	360698
30	책임 형승우	456865	151219	305646
31	변리사 이초은	276078	151133	124945
32	상무 손태식	505679	150017	355662
33	차장 김복기	251140	149169	101971
34	사원 배준영	271654	147122	124532
35	변리사 서예은	400000	146380	253620
36	사원 최정하	405021	146305	258716
37	대리 김희정	504027	142701	361326
38	대리 함소희	302121	142019	160102
39	과장 이영주	685382	141325	544057
40	차장 김형태	252719	138774	113945
41	변리사 윤명백	400000	134115	265885
42	차장 박선정	430741	130688	300053
43	사원 이유진	249609	128388	121221
44	변리사 김석래	455971	128004	327967
45	변리사 조형우	357482	127138	230344
46	변리사 김형기	470934	125886	345048
47	변리사 송요한	455100	123033	332067
48	차장 이데레사	298474	115195	183279
49	대리 정재욱	548633	114273	434360
50	부장 정석현	312330	103875	208455
51	과장 이지혜	364234	101701	262533
52	사원 김진영	295686	101418	194268
53	변리사 정의성	335164	100925	234239
54	변리사 김은구	463425	92585	370840
55	변리사 이정훈	211679	92194	119485
56	사원 이시원	39424	61497	-22073
57	사원 황성빈	90020	50318	39702`;

const runnerColors = [
  "#6c5ce7", "#5f7cff", "#2ec4b6", "#7b61ff", "#4dabf7",
  "#51cf66", "#9775fa", "#22b8cf", "#845ef7", "#69db7c"
];

function parseTextToRunners(text) {
  const rows = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return rows
    .map((row, index) => {
      const parts = row.split(/\t|,/).map((v) => v.trim());
      const rank = Number(parts[0]);
      const name = parts[1];
      const goalSteps = Number(parts[2]);
      const currentSteps = Number(parts[3]);

      if (
        Number.isNaN(rank) ||
        !name ||
        Number.isNaN(goalSteps) ||
        Number.isNaN(currentSteps)
      ) {
        return null;
      }

      return {
        id: index + 1,
        rank,
        name,
        goalSteps,
        currentSteps,
        color: runnerColors[index % runnerColors.length],
      };
    })
    .filter(Boolean);
}

function getRemainingSteps(runner) {
  return runner.goalSteps - runner.currentSteps;
}

function getCompletionRate(runner) {
  if (!runner.goalSteps) return 0;
  return (runner.currentSteps / runner.goalSteps) * 100;
}

function formatRemaining(value) {
  if (value >= 0) return `${value.toLocaleString()}보`;
  return `초과 ${Math.abs(value).toLocaleString()}보`;
}

function sortByRank(runners) {
  return [...runners].sort((a, b) => a.rank - b.rank);
}

export default function App() {
  const [search, setSearch] = useState("");
  const [csvInput, setCsvInput] = useState(initialData);
  const [runners, setRunners] = useState(parseTextToRunners(initialData));

  const sorted = useMemo(() => sortByRank(runners), [runners]);
  const leader = sorted[0];

  const totalCurrentSteps = sorted.reduce((sum, runner) => sum + runner.currentSteps, 0);
  const totalRemainingSteps = sorted.reduce((sum, runner) => sum + getRemainingSteps(runner), 0);
  const averageCompletion =
    sorted.length > 0
      ? sorted.reduce((sum, runner) => sum + getCompletionRate(runner), 0) / sorted.length
      : 0;

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return sorted;
    return sorted.filter((runner) => runner.name.toLowerCase().includes(keyword));
  }, [search, sorted]);

  const applyCsv = () => {
    const parsed = parseTextToRunners(csvInput);
    if (parsed.length > 0) {
      setRunners(parsed);
    } else {
      alert("형식이 맞지 않아요. 예: 1,홍길동,500000,231000");
    }
  };

  const updateRunnerField = (id, field, value) => {
    setRunners((prev) =>
      prev.map((runner) =>
        runner.id === id
          ? { ...runner, [field]: Math.max(0, Number(value) || 0) }
          : runner
      )
    );
  };

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        body {
          margin: 0;
          font-family: Arial, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif;
          background: linear-gradient(180deg, #f3eadb 0%, #efe3cf 40%, #e8dcc7 100%);
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
        .trackDesc {
          font-size: 13px;
          color: #166534;
          margin-top: 4px;
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
        .bottomGrid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .innerCard {
          background: white;
          border-radius: 22px;
          padding: 18px;
          border: 1px solid #eef2f7;
        }
        .sectionTitle {
          font-size: 18px;
          font-weight: 900;
          margin: 0 0 12px 0;
        }
        textarea, input {
          width: 100%;
          border: 1px solid #d1d5db;
          border-radius: 14px;
          padding: 12px;
          font-size: 14px;
        }
        textarea {
          min-height: 220px;
          resize: vertical;
        }
        .smallText {
          font-size: 13px;
          color: #6b7280;
          line-height: 1.7;
        }
        .miniList {
          max-height: 320px;
          overflow: auto;
        }
        .miniRow {
          display: grid;
          grid-template-columns: 90px 1fr 130px 130px;
          gap: 8px;
          margin-bottom: 8px;
          align-items: center;
        }
        .miniRank, .miniName {
          background: #f8fafc;
          border-radius: 14px;
          padding: 12px;
          font-size: 14px;
          font-weight: 800;
        }
        .rankingSearch {
          margin-bottom: 12px;
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

        @media (max-width: 1200px) {
          .layout {
            grid-template-columns: 1fr;
          }
          .stats {
            grid-template-columns: repeat(2, 1fr);
          }
          .bottomGrid {
            grid-template-columns: 1fr;
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
          .miniRow {
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
        }
      `}</style>

      <div className="page">
        <div className="container">
          <div className="header">
            <h1 className="title">유일하이스트 시즌8 챌린지</h1>
            <p className="subtitle">
              총 57명이 참여 중인 챌린지입니다. 현재 걸음 수 기준 순위를 그대로 반영했고,
              각 참여자의 목표 걸음 수, 현재 걸음 수, 남은 걸음 수, 달성률을 함께 볼 수 있게 구성했습니다.
            </p>
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
                    <div>
                      <div className="trackTitle">실시간 레이스 트랙</div>
                      <div className="trackDesc">
                        순위는 네가 준 순위를 그대로 사용하고, 이름표에는 달성률을 표시했어.
                      </div>
                    </div>
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
                              {runner.rank}위 · {runner.name} · {completion.toFixed(1)}%
                            </div>

                            <div
                              className="runnerSpriteWrap"
                              title={`${runner.name} / 현재 ${runner.currentSteps.toLocaleString()}보 / 남은 ${formatRemaining(getRemainingSteps(runner))}`}
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

                <div className="bottomGrid">
                  <div className="innerCard">
                    <h3 className="sectionTitle">데이터 붙여넣기</h3>
                    <p className="smallText">
                      형식은 <strong>순위,이름,목표걸음수,현재걸음수</strong> 이고,
                      엑셀에서 복사한 탭 형식도 그대로 붙여넣을 수 있어.
                    </p>
                    <textarea
                      value={csvInput}
                      onChange={(e) => setCsvInput(e.target.value)}
                    />
                    <div style={{ marginTop: 12 }}>
                      <button onClick={applyCsv}>데이터 적용</button>
                    </div>
                  </div>

                  <div className="innerCard">
                    <h3 className="sectionTitle">상위 참가자 직접 수정</h3>
                    <p className="smallText">
                      목표 걸음 수와 현재 걸음 수를 수정할 수 있어. 순위 번호는 그대로 유지돼.
                    </p>

                    <div className="miniList">
                      {sorted.slice(0, 10).map((runner) => (
                        <div className="miniRow" key={runner.id}>
                          <div className="miniRank">{runner.rank}위</div>
                          <div className="miniName">{runner.name}</div>
                          <input
                            type="number"
                            value={runner.goalSteps}
                            onChange={(e) => updateRunnerField(runner.id, "goalSteps", e.target.value)}
                            placeholder="목표"
                          />
                          <input
                            type="number"
                            value={runner.currentSteps}
                            onChange={(e) => updateRunnerField(runner.id, "currentSteps", e.target.value)}
                            placeholder="현재"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="sectionTitle">실시간 순위</h3>

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
                  const gap = leader ? leader.currentSteps - runner.currentSteps : 0;

                  return (
                    <div
                      key={runner.id}
                      className={`rankCard ${index === 0 ? "leader" : ""}`}
                    >
                      <div className="rankTop">
                        <div className="rankLeft">
                          <div
                            className="rankNo"
                            style={{ background: runner.color }}
                          >
                            {runner.rank}
                          </div>
                          <div>
                            <div className="rankName">{runner.name}</div>
                            <div className="rankGap">
                              {runner.rank === 1 ? "현재 선두" : `1위와 ${gap.toLocaleString()}보 차이`}
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
                          <div className="infoValue">{runner.goalSteps.toLocaleString()}보</div>
                        </div>
                        <div className="infoBox">
                          <div className="infoLabel">현재 걸음 수</div>
                          <div className="infoValue">{runner.currentSteps.toLocaleString()}보</div>
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