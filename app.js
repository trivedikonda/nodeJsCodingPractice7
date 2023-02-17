const express = require("express");
const app = express();
app.use(express.json());
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3001, () => {
      console.log("Server Running At http://localhost:3001");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

//API 1

const convertDbObjToResponseObj = (playerObj) => {
  return {
    playerId: playerObj.player_id,
    playerName: playerObj.player_name,
  };
};

app.get("/players/", async (request, response) => {
  const allPlayersQuery = `SELECT * FROM player_details;`;
  getPlayersQuery = await db.all(allPlayersQuery);
  response.send(
    getPlayersQuery.map((player) => convertDbObjToResponseObj(player))
  );
});

// API 2

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;

  const getPlayer = `
    SELECT * FROM player_details WHERE player_id = ${playerId};`;
  const singlePlayerQuery = await db.get(getPlayer);
  response.send(convertDbObjToResponseObj(singlePlayerQuery));
});

//API 3

app.put("/players/:playerId/", async (request, response) => {
  const { playerName } = request.body;
  const { playerId } = request.params;
  const putPlayer = `UPDATE 
        player_details 
    SET 
        player_name = '${playerName}'
    WHERE 
        player_id = '${playerId}';
    `;
  await db.run(putPlayer);
  response.send("Player Details Updated");
});

//API 4
const convertMatchDbObjToResponseObj = (matchObj) => {
  return {
    matchId: matchObj.match_id,
    match: matchObj.match,
    year: matchObj.year,
  };
};

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const matchQuery = `SELECT * 
  FROM match_details WHERE match_id = ${matchId};`;
  const getMatchQuery = await db.get(matchQuery);
  response.send(convertMatchDbObjToResponseObj(getMatchQuery));
});

//API 5

app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerDetails = `SELECT * 
  FROM match_details NATURAL JOIN player_match_score WHERE player_id = ${playerId};`;
  const playerDetailsQuery = await db.all(getPlayerDetails);
  response.send(
    playerDetailsQuery.map((eachMatch) =>
      convertMatchDbObjToResponseObj(eachMatch)
    )
  );
});

//API 6

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const allMatchPlayerDetailsList = `SELECT * FROM player_details NATURAL JOIN player_match_score 
    WHERE match_id = ${matchId};`;
  const matchPlayerDetailsQuery = await db.all(allMatchPlayerDetailsList);
  response.send(
    matchPlayerDetailsQuery.map((match) => convertDbObjToResponseObj(match))
  );
});

//API 7

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;

  const completeStats = `SELECT 
        player_details.player_id AS playerId,
        player_details.player_name AS playerName,
        SUM(player_match_score.score) AS totalScore,
        SUM(player_match_score.fours) AS totalFours, 
        SUM(player_match_score.sixes) AS totalSixes
     FROM 
        player_details INNER JOIN player_match_score 
        ON player_details.player_id = player_match_score.player_id 
        WHERE player_details.player_id = ${playerId};`;
  const completeStatsQuery = await db.all(completeStats);
  return response.send(completeStatsQuery);
});

module.exports = app;
