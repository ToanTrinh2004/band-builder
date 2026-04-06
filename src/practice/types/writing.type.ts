export interface IELTSCriterion {
    score:       number;
    rationale:   string;
    examples:    string;
    suggestions: string;
  }
  
  export interface IELTSScore {
    overall_band: number;
    criteria: {
      task_achievement?:               IELTSCriterion; // task1
      task_response?:                  IELTSCriterion; // task2
      coherence_and_cohesion:          IELTSCriterion;
      lexical_resource:                IELTSCriterion;
      grammatical_range_and_accuracy:  IELTSCriterion;
    };
    overall_feedback:      string;
    key_strengths:         string[];
    key_weaknesses:        string[];
    priority_improvements: string[];
    image_feedback?: {
      data_accuracy:        string;
      overview_present:     boolean;
      key_features_covered: string[];
      key_features_missed:  string[];
    };
  }