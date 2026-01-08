export interface ReviewResult {
  interval: number;
  repetition: number;
  easinessFactor: number;
}

export const calculateReview = (
  quality: number,
  previousInterval: number,
  previousRepetition: number,
  previousEasinessFactor: number
): ReviewResult => {
  let interval = 0;
  let repetition = 0;
  let easinessFactor = 0;

  if (quality >= 3) {
    if (previousRepetition === 0) {
      interval = 1;
    } else if (previousRepetition === 1) {
      interval = 6;
    } else {
      interval = Math.round(previousInterval * previousEasinessFactor);
    }
    repetition = previousRepetition + 1;
  } else {
    repetition = 0;
    interval = 1;
  }

  easinessFactor =
    previousEasinessFactor +
    (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

  if (easinessFactor < 1.3) {
    easinessFactor = 1.3;
  }

  return {
    interval,
    repetition,
    easinessFactor,
  };
};

export const initialReviewState: ReviewResult = {
  interval: 0,
  repetition: 0,
  easinessFactor: 2.5,
};
