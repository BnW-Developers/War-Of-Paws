import os from 'os';

const delay = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const getCpuUsage = async () => {
  const startTimes = os.cpus().map((cpu) => cpu.times);

  // 1초 대기
  await delay(1000);

  const endTimes = os.cpus().map((cpu) => cpu.times);

  const usagePercentages = startTimes.map((start, index) => {
    const end = endTimes[index];

    const idleDiff = end.idle - start.idle;
    const totalDiff =
      end.user -
      start.user +
      (end.nice - start.nice) +
      (end.sys - start.sys) +
      (end.irq - start.irq) +
      idleDiff;

    const usagePercentage = ((totalDiff - idleDiff) / totalDiff) * 100;

    return usagePercentage.toFixed(2); // 소수점 둘째 자리까지 표시
  });

  return usagePercentages[0]; // 첫 번째 코어의 CPU 사용률 반환(프리티어라 단일코어)
};

export const getMemUsage = () => {
  const totalMem = os.totalmem(); // 총 메모리 (바이트)
  const freeMem = os.freemem(); // 사용 가능한 메모리 (바이트)
  return ((1 - freeMem / totalMem) * 100).toFixed(2);
};
