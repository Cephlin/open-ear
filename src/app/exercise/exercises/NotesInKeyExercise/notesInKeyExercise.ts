import { Exercise } from '../../Exercise';
import {
  NotesRange,
  randomFromList,
  SolfegeNote,
  scaleDegreeToSolfegeNote,
  getResolutionFromScaleDegree,
  getScaleDegreeFromNote,
  solfegeNoteToScaleDegree,
  ScaleDegree,
  DeepReadonly,
  getDiatonicScaleDegreeWithAccidental,
  Interval,
} from '../../utility';
import { Note } from 'tone/Tone/core/type/NoteUnits';
import { getNoteType } from '../../utility/music/notes/getNoteType';
import { NoteType } from '../../utility/music/notes/NoteType';
import { getNoteOctave } from '../../utility/music/notes/getNoteOctave';
import { noteTypeToNote } from '../../utility/music/notes/noteTypeToNote';
import { NotesInKeyExplanationComponent } from './notes-in-key-explanation/notes-in-key-explanation.component';
import {
  MelodicDictationExerciseSettings,
  IMelodicQuestion,
  melodicExercise,
} from '../utility/exerciseAttributes/melodicDictationExercise';
import {
  NumberOfSegmentsSetting,
  numberOfSegmentsControlDescriptorList,
} from '../utility/settings/NumberOfSegmentsSetting';
import {
  PlayAfterCorrectAnswerSetting,
  playAfterCorrectAnswerControlDescriptorList,
} from '../utility/settings/PlayAfterCorrectAnswerSetting';
import {
  IncludedAnswersSettings,
  includedAnswersSettings,
} from '../utility/settings/IncludedAnswersSettings';
import { noteTypeToScaleDegree } from '../../utility/music/scale-degrees/noteTypeToScaleDegree';
import { scaleDegreeToNoteType } from '../../utility/music/scale-degrees/scaleDegreeToNoteType';
import { transpose } from '../../utility/music/transpose';
import { composeExercise } from '../utility/exerciseAttributes/composeExercise';
import { createExercise } from '../utility/exerciseAttributes/createExercise';
import { TonalExerciseUtils } from '../utility/exerciseAttributes/tonalExercise';

type NoteInKeySettings =
  IncludedAnswersSettings<SolfegeNote> &
  MelodicDictationExerciseSettings &
  NumberOfSegmentsSetting &
  PlayAfterCorrectAnswerSetting & {
  notesRange: 'high' | 'middle' | 'bass' | 'contrabass',
};

export function notesInKeyExercise() {
  const rangeOptionToNotesRange: { [range in NoteInKeySettings['notesRange']]: NotesRange } = {
    high: new NotesRange('C4', 'G6'),
    middle: new NotesRange('G2', 'E4'),
    bass: new NotesRange('A1', 'C3'),
    contrabass: new NotesRange('Eb1', 'Eb2'),
  };

  function getSolfegeNoteOfNoteInC(note: Note): SolfegeNote {
    return scaleDegreeToSolfegeNote[noteTypeToScaleDegree(getNoteType(note), 'C')];
  }

  return composeExercise(
    melodicExercise(),
    includedAnswersSettings<SolfegeNote>({
      defaultSelectedAnswers: ['Do', 'Re', 'Mi'],
      name: 'Scale Degrees',
    }),
    createExercise,
  )({
    id: 'noteInKey',
    name: `Scale Degrees`,
    summary: `Identify monophonic notes based on their tonal context in a particular key`,
    explanation: NotesInKeyExplanationComponent,
    getMelodicQuestionInC(settings: NoteInKeySettings, tonalExerciseUtils: TonalExerciseUtils): IMelodicQuestion {
      function rangeForKeyOfC(): NotesRange {
        return tonalExerciseUtils.getRangeForKeyOfC(rangeOptionToNotesRange[settings.notesRange]);
      }

      function getQuestionOptionsInC(): Note[] {
        return rangeForKeyOfC().getAllNotes().filter((note: Note) => getSolfegeNoteOfNoteInC(note));
      }

      const noteOptions: Note[] = getQuestionOptionsInC().filter(questionOption => settings.includedAnswers.includes(getSolfegeNoteOfNoteInC(questionOption)));
      let randomQuestionsInC: Note[] = Array.from(Array(settings.numberOfSegments)).map(() => randomFromList(noteOptions));

      // calculation resolution
      let resolution: Note[] = [];
      if (settings.numberOfSegments === 1 && settings.playAfterCorrectAnswer) {
        const note: Note = randomQuestionsInC[0];

        const scaleDegree: ScaleDegree = getScaleDegreeFromNote('C', note);
        const resolutionInScaleDegrees: DeepReadonly<ScaleDegree[]> = getResolutionFromScaleDegree(
          scaleDegree,
          settings.includedAnswers.map(solfege => solfegeNoteToScaleDegree[solfege]),
          settings.cadenceType,
        );
        const resolutionInNoteTypes: NoteType[] = resolutionInScaleDegrees.map(scaleDegree => scaleDegreeToNoteType(scaleDegree, 'C'));
        let octaveNumber = getNoteOctave(note);
        resolution = resolutionInNoteTypes.map(noteType => noteTypeToNote(noteType, octaveNumber));
        /**
         * For resolutions up the last note should be an octave above
         * (It's not ideal that this needs to be done manually. We should reconsider this)
         * */
        if (getDiatonicScaleDegreeWithAccidental(scaleDegree).diatonicScaleDegree >= 5) {
          resolution[resolution.length - 1] = transpose(resolution[resolution.length - 1], Interval.Octave);
        }
      }

      return {
        segments: randomQuestionsInC,
        afterCorrectAnswer: resolution.map((note, index) => ({
          partToPlay: [{
            notes: note,
            duration: index === 0 ? '4n' : index === resolution.length - 1 ? '2n' : '8n',
          }],
          answerToHighlight: getSolfegeNoteOfNoteInC(note),
        })),
      }
    },
    settingsDescriptors: [
      {
        key: 'displayMode',
        info: 'Choose how the scale degrees are noted. <br>(This setting will apply only after you close the settings page.)',
        descriptor: {
          label: 'Display',
          controlType: 'select',
          options: [
            {
              label: 'Numbers',
              value: 'numeral',
            },
            {
              label: 'Movable-Do',
              value: 'solfege',
            },
          ],
        },
      },
      {
        key: 'notesRange',
        info: 'Choose how high or low the notes will be played',
        descriptor: ((): Exercise.SelectControlDescriptor<NoteInKeySettings['notesRange']> => {
          return {
            controlType: 'select',
            label: 'Range',
            options: [
              {
                label: 'High',
                value: 'high',
              },
              {
                label: 'Middle',
                value: 'middle',
              },
              {
                label: 'Bass',
                value: 'bass',
              },
              {
                label: 'Contra Bass',
                value: 'contrabass',
              },
            ],
          }
        })(),
      },
      ...numberOfSegmentsControlDescriptorList('notes'),
      ...playAfterCorrectAnswerControlDescriptorList({
        show: ((settings: NoteInKeySettings) => settings.numberOfSegments === 1),
      }),
    ],
    defaultSettings: {
      numberOfSegments: 1,
      playAfterCorrectAnswer: true,
      notesRange: 'middle',
      displayMode: 'numeral',
    }
  });
}