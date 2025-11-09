const { getAvailablePrizes, determinePrize } = require('./wheel-utils');

console.log('🎰 Тестирование прогрессивной системы призов\n');

// Тест 1: Проверка уровней доступа
console.log('=== Тест 1: Уровни доступа ===');
for (let spins = 0; spins <= 7; spins++) {
  const prizes = getAvailablePrizes(spins);
  console.log(`${spins} спин(ов): [${prizes.join(', ')}]`);
}

// Тест 2: Невалидные значения
console.log('\n=== Тест 2: Невалидные значения ===');
console.log('undefined:', getAvailablePrizes(undefined));
console.log('null:', getAvailablePrizes(null));
console.log('0:', getAvailablePrizes(0));
console.log('-5:', getAvailablePrizes(-5));
console.log('"строка":', getAvailablePrizes("5"));
console.log('3.7 (дробное):', getAvailablePrizes(3.7));

// Тест 3: Генерация призов для разных уровней
console.log('\n=== Тест 3: Генерация призов (10 попыток на уровень) ===');

function testPrizeGeneration(spins, iterations = 10) {
  const results = {};
  
  for (let i = 0; i < iterations; i++) {
    const randomValue = Math.random() * 100;
    const prize = determinePrize(randomValue, spins);
    results[prize] = (results[prize] || 0) + 1;
  }
  
  return results;
}

[1, 2, 3, 4, 5, 6].forEach(spins => {
  const results = testPrizeGeneration(spins, 100);
  console.log(`\n${spins} спин(ов):`);
  console.log('Доступные призы:', getAvailablePrizes(spins).join(', '));
  console.log('Результаты 100 попыток:', results);
});

// Тест 4: Проверка что джекпот НЕ выпадает при < 6 спинов
console.log('\n=== Тест 4: Джекпот только при 6+ спинах ===');
for (let spins = 1; spins <= 5; spins++) {
  let jackpotFound = false;
  for (let i = 0; i < 1000; i++) {
    const randomValue = Math.random() * 100;
    const prize = determinePrize(randomValue, spins);
    if (prize === 'jackpot') {
      jackpotFound = true;
      break;
    }
  }
  console.log(`${spins} спин(ов): Джекпот выпал? ${jackpotFound ? '❌ БАГ!' : '✅ НЕТ'}`);
}

let jackpotFoundAt6 = false;
for (let i = 0; i < 1000; i++) {
  const randomValue = Math.random() * 100;
  const prize = determinePrize(randomValue, 6);
  if (prize === 'jackpot') {
    jackpotFoundAt6 = true;
    break;
  }
}
console.log(`6+ спинов: Джекпот может выпасть? ${jackpotFoundAt6 ? '✅ ДА' : '❌ БАГ!'}`);

console.log('\n✅ Тесты завершены!');
