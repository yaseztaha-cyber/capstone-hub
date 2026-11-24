'use client';

import TitleSlide from './slides/TitleSlide';
import ProblemSlide from './slides/ProblemSlide';
import ResearchSlide from './slides/ResearchSlide';
import ScienceSlide from './slides/ScienceSlide';
import DesignSlide from './slides/DesignSlide';
import PrototypeSlide from './slides/PrototypeSlide';
import TestingSlide from './slides/TestingSlide';
import ResultsSlide from './slides/ResultsSlide';
import ConclusionSlide from './slides/ConclusionSlide';
import GrandChallengeSlide from './slides/GrandChallengeSlide';

const SLIDES = [
  TitleSlide,
  ProblemSlide,
  ResearchSlide,
  ScienceSlide,
  DesignSlide,
  PrototypeSlide,
  TestingSlide,
  ResultsSlide,
  ConclusionSlide,
  GrandChallengeSlide,
];

export const TOTAL_SLIDES = SLIDES.length;

interface SlideRendererProps {
  slideIndex: number;
}

export default function SlideRenderer({ slideIndex }: SlideRendererProps) {
  const SlideComponent = SLIDES[slideIndex];
  if (!SlideComponent) return null;
  return <SlideComponent />;
}
