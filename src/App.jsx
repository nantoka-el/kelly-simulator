// Kelly Betting Simulator - 完全コード

import React, { useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const calculateKelly = (winRate, odds) => {
  const b = odds - 1;
  const p = winRate;
  const q = 1 - p;
  const kelly = (b * p - q) / b;
  return Math.max(kelly, 0);
};

const getRandomGameCount = () => {
  const r = Math.random();
  if (r < 0.05) return 0;
  if (r < 0.10) return 1;
  if (r < 0.30) return 2;
  if (r < 0.50) return 3;
  if (r < 0.70) return 4;
  if (r < 0.90) return 5;
  return 6;
};

export default function KellySimulator() {
  const [initialFunds, setInitialFunds] = useState(1000000);
  const [winRate, setWinRate] = useState(0.58);
  const [fixedBet, setFixedBet] = useState(20000);
  const [days, setDays] = useState(100);
  const [gamesPerDay, setGamesPerDay] = useState(4);
  const [useRandomGameCount, setUseRandomGameCount] = useState(true);
  const [result, setResult] = useState(null);
  const [log, setLog] = useState([]);

  const simulate = () => {
    const odds = 1.9;
    const kellyRate = calculateKelly(winRate, odds);
    const kellyDiv3 = kellyRate / 3;
    const halfKellyDiv3 = (kellyRate / 2) / 3;

    const results = {
      labels: [],
      datasets: [
        { label: "定額打ち", data: [], borderColor: "gray" },
        { label: "ケリー/3", data: [], borderColor: "blue", pointBackgroundColor: [] },
        { label: "ケリー/6", data: [], borderColor: "green", pointBackgroundColor: [] },
      ],
    };

    let fundFixed = initialFunds;
    let fundKelly = initialFunds;
    let fundHalfKelly = initialFunds;
    const newLog = [];

    let lastKellyBet = 0;
    let lastHalfKellyBet = 0;
    let totalWins = 0;
    let totalLosses = 0;
    let dayProfitPositive = 0;
    let dayProfitNegative = 0;

    const gameCounts = [];
    const winMatrix = [];

    for (let i = 0; i < days; i++) {
      const gc = useRandomGameCount ? getRandomGameCount() : gamesPerDay;
      gameCounts.push(gc);
      winMatrix.push(Array.from({ length: gc }, () => Math.random() < winRate));
    }

    for (let day = 0; day < days; day++) {
      const gameCount = gameCounts[day];
      const outcomes = winMatrix[day];
      results.labels.push(`Day ${day + 1}`);

      let wins = 0;
      let losses = 0;
      let profitToday = 0;

      for (let i = 0; i < gameCount; i++) {
        if (outcomes[i]) {
          wins++;
          fundFixed += fixedBet * (odds - 1);
          profitToday += fixedBet * (odds - 1);
        } else {
          losses++;
          fundFixed -= fixedBet;
          profitToday -= fixedBet;
        }
      }

      totalWins += wins;
      totalLosses += losses;
      if (profitToday > 0) dayProfitPositive++;
      if (profitToday < 0) dayProfitNegative++;

      const kellyBet = Math.max(Math.floor((fundKelly * kellyDiv3) / 10000) * 10000, 10000);
      const halfKellyBet = Math.max(Math.floor((fundHalfKelly * halfKellyDiv3) / 10000) * 10000, 10000);

      const kellyChanged = kellyBet !== lastKellyBet;
      const halfKellyChanged = halfKellyBet !== lastHalfKellyBet;

      const kellyEmoji = kellyChanged ? " 🔺" : "";
      const halfKellyEmoji = halfKellyChanged ? " 🔸" : "";

      const kellyStart = fundKelly;
      const halfStart = fundHalfKelly;

      for (let i = 0; i < gameCount; i++) {
        fundKelly += outcomes[i] ? kellyBet * (odds - 1) : -kellyBet;
        fundHalfKelly += outcomes[i] ? halfKellyBet * (odds - 1) : -halfKellyBet;
      }

      lastKellyBet = kellyBet;
      lastHalfKellyBet = halfKellyBet;

      results.datasets[0].data.push(fundFixed);
      results.datasets[1].data.push(fundKelly);
      results.datasets[1].pointBackgroundColor.push(kellyChanged ? "red" : "blue");
      results.datasets[2].data.push(fundHalfKelly);
      results.datasets[2].pointBackgroundColor.push(halfKellyChanged ? "orange" : "green");

      newLog.push(
        `Day ${day + 1}: ${wins}勝${losses}敗（試合数: ${gameCount}）\n` +
        `  定額打ち: 1試合 ¥${fixedBet.toLocaleString()}（収支 ¥${profitToday.toLocaleString()}）\n` +
        `  ケリー/3: 1試合 ¥${kellyBet.toLocaleString()}${kellyEmoji}（資金 ¥${kellyStart.toLocaleString()} → ¥${fundKelly.toLocaleString()}）\n` +
        `  ケリー/6: 1試合 ¥${halfKellyBet.toLocaleString()}${halfKellyEmoji}（資金 ¥${halfStart.toLocaleString()} → ¥${fundHalfKelly.toLocaleString()}）`
      );
    }

    setResult({
      chartData: results,
      finalFunds: { fixed: fundFixed, kelly: fundKelly, halfKelly: fundHalfKelly },
      stats: { dayProfitPositive, dayProfitNegative, totalWins, totalLosses },
    });
    setLog(newLog);
  };

  return (
    <div className="p-4 max-w-screen-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Kelly Betting Simulator</h1>
      <div className="space-y-3">
        <div>
          <label>初期資金:</label>
          <input type="number" value={initialFunds} onChange={(e) => setInitialFunds(Number(e.target.value))} className="border w-full" />
        </div>
        <div>
          <label>勝率 (%):</label>
          <input
            type="number"
            step="1"
            min="0"
            max="100"
            value={winRate * 100}
            onChange={(e) => setWinRate(Number(e.target.value) / 100)}
            className="border w-full"
          />
        </div>
        <div>
          <label>定額ベット額:</label>
          <input type="number" value={fixedBet} onChange={(e) => setFixedBet(Number(e.target.value))} className="border w-full" />
          <p className="text-xs text-gray-600">※定額打ちの結果に影響します</p>
        </div>
        <div>
          <label>日数:</label>
          <input type="number" value={days} onChange={(e) => setDays(Number(e.target.value))} className="border w-full" />
        </div>
        <div>
          <label>1日あたりの試合数:</label>
          <input type="number" value={gamesPerDay} onChange={(e) => setGamesPerDay(Number(e.target.value))} className="border w-full" />
        </div>
        <div className="bg-gray-50 p-2 rounded border text-sm">
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              checked={useRandomGameCount}
              onChange={(e) => setUseRandomGameCount(e.target.checked)}
              className="mr-2"
            />
            リアルランダム試合数
          </label>
          <p className="mt-1 text-xs text-gray-600">
            出現確率：5%で0試合、5%で1試合、20%で2〜5試合、10%で6試合<br />
            ※チェックが入っている場合は、入力した試合数よりもこちらが優先されます。
          </p>
        </div>
        <button onClick={simulate} className="bg-blue-500 text-white px-4 py-2 rounded w-full">
          シミュレーション開始
        </button>
      </div>

      {result && (
        <div className="mt-6 space-y-4">
          <Line data={result.chartData} />

          <table className="text-sm w-full border mt-4">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-2">収支プラス日</th>
                <th className="border px-2">収支マイナス日</th>
                <th className="border px-2">勝利試合数</th>
                <th className="border px-2">敗北試合数</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border px-2 text-center">{result.stats.dayProfitPositive}</td>
                <td className="border px-2 text-center">{result.stats.dayProfitNegative}</td>
                <td className="border px-2 text-center">{result.stats.totalWins}</td>
                <td className="border px-2 text-center">{result.stats.totalLosses}</td>
              </tr>
            </tbody>
          </table>

          <div>
            <h2 className="font-semibold text-lg">📘 ログ：</h2>
            <pre className="whitespace-pre-wrap bg-gray-100 p-2 rounded max-h-96 overflow-y-scroll text-sm">
              {log.map((entry, index) => (
                <div key={index}>{entry}</div>
              ))}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
