// This service simulates the backend ML logic using TensorFlow.js in the browser.
// In the full MERN stack, this would reside in `server/ml/masteryModel.js`.

declare global {
  interface Window {
    tf: any;
  }
}

let model: any = null;

// Initialize and train a simple linear regression model
export const initModel = async () => {
  if (!window.tf) {
    console.warn("TensorFlow.js not loaded yet. Skipping model training.");
    return;
  }

  const tf = window.tf;

  // Define a simple model
  model = tf.sequential();
  model.add(tf.layers.dense({ units: 1, inputShape: [1] }));

  model.compile({ loss: 'meanSquaredError', optimizer: 'sgd' });

  // Generate some synthetic training data
  // Logic: Next Difficulty ~= Current Mastery + 5 (Pushing the student slightly)
  const xs = tf.tensor2d([50, 60, 70, 80, 90, 100], [6, 1]);
  const ys = tf.tensor2d([55, 65, 75, 85, 95, 100], [6, 1]);

  // Train the model
  await model.fit(xs, ys, { epochs: 50 });
  
  xs.dispose();
  ys.dispose();
  console.log("ML Model Trained");
};

export const predictNextDifficulty = async (recentScores: number[]): Promise<number> => {
  // 1. Input Validation: Ensure we always have an array
  const safeScores = Array.isArray(recentScores) ? recentScores : [];
  
  // Calculate Average (Base Logic)
  const sum = safeScores.reduce((a, b) => a + b, 0);
  const averageScore = safeScores.length > 0 ? sum / safeScores.length : 50; // Default start at 50

  // 2. TF Prediction (if available)
  if (model && window.tf) {
    try {
      const tf = window.tf;
      const inputTensor = tf.tensor2d([averageScore], [1, 1]);
      const prediction = model.predict(inputTensor);
      const data = await prediction.data();
      const predictionValue = data[0];

      inputTensor.dispose();
      prediction.dispose();

      // Check for NaN result from model
      if (!isNaN(predictionValue)) {
         return Math.min(100, Math.max(1, Math.round(predictionValue)));
      }
    } catch (e) {
      console.error("ML Prediction failed, using fallback:", e);
    }
  }

  // 3. Fallback Logic (Heuristic)
  // If user is doing well (>70), increase difficulty significantly
  // If struggling (<50), decrease slightly or keep same
  let nextDiff = averageScore;
  if (averageScore > 80) nextDiff += 10;
  else if (averageScore > 60) nextDiff += 5;
  else if (averageScore < 40) nextDiff -= 5;
  else nextDiff += 2; // Slow progression for middle ground

  const result = Math.min(100, Math.max(1, Math.round(nextDiff)));
  
  // Final Safety Net
  return isNaN(result) ? 50 : result;
};