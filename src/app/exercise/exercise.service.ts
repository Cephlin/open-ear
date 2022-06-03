import {
  Injectable,
  Type,
} from '@angular/core';
import * as _ from 'lodash';
import { IntervalExercise } from './exercises/IntervalExercise/IntervalExercise';
import { Exercise } from './Exercise';
import { ChordsInKeyExercise } from './exercises/ChordInKeyExercise/ChordsInKeyExercise';
import { NotesInKeyExercise } from './exercises/NotesInKeyExercise/NotesInKeyExercise';
import { ChordTypeInKeyExercise } from './exercises/ChordTypeInKeyExercise/ChordTypeInKeyExercise';
import { TriadInversionExercise } from './exercises/TriadInversionExercise/TriadInversionExercise';
import { CommonChordProgressionsExercise } from './exercises/CommonChordProgressionExercise/CommonChordProgressionsExercise';
import { ChordArpeggioExercise } from './exercises/ChordArpeggioExercise/ChordArpeggioExercise';
import { NotesWithChordsExercise } from './exercises/NotesWithChords/NotesWithChordsExercise';
import { ChordsInRealSongsExercise } from './exercises/ChordsInRealSongsExercise/ChordsInRealSongsExercise';
import { Platform } from '@ionic/angular';
import IExercise = Exercise.IExercise;
import { InstrumentExercise } from './exercises/InstrumentExercise/InstrumentExercise';

@Injectable({
  providedIn: 'root'
})
export class ExerciseService {
  static readonly _exerciseList: IExercise[] = [
    new NotesInKeyExercise(),
    new ChordsInKeyExercise(),
    new CommonChordProgressionsExercise(),
    new ChordsInRealSongsExercise(),
    new ChordTypeInKeyExercise(),
    new NotesWithChordsExercise(),
    new TriadInversionExercise(),
    new InstrumentExercise(),
    // new ChordArpeggioExercise(),
    new IntervalExercise(),
  ];
  private readonly _exerciseIdToExercise = _.keyBy(ExerciseService._exerciseList, 'id');
  static readonly ngComponents: Type<any>[] = ExerciseService._exerciseList
    .map(exercise => exercise.explanation)
    .filter((explanation): explanation is Type<any> => !!explanation && typeof explanation != 'string')

  constructor(private readonly _platform: Platform) {
  }

  getExercise(id: string): IExercise {
    return this._exerciseIdToExercise[id];
  }

  getExerciseList(): IExercise[] {
    return ExerciseService._exerciseList.filter((exercise: IExercise) => !exercise.blackListPlatform || !this._platform.is(exercise.blackListPlatform));
  }
}
