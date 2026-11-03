import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { business } from '../constants/business';
import { LIGHT as c } from '../globalStyle/tokens';
import { RADIUS } from '../globalStyle/Theme';
import { isHoliday, monthMatrix } from '../lib/schedule';
import { isSunday, todayET } from '../lib/format';
import Sizer from '../helpers/Sizer';
import { TEXT, Text } from './Typography';

const { hSize, vSize, fS } = Sizer;

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * The month grid from the web's booking `StepSchedule`, lifted into the kit.
 *
 * It is extracted rather than inlined because the web's reschedule sheet uses an
 * `<input type="date">` for the same job, and React Native has no date input —
 * the cross-platform answer would be a new native module and a pod. Reusing the
 * calendar the app already draws keeps both places consistent, adds no
 * dependency, and keeps the business rules visible: Sunday is marked closed and
 * holidays are flagged, which a bare OS date picker cannot show.
 *
 * Everything else is the web's: `monthMatrix` for the cells, Prev/Next for the
 * month, red Sundays, and "Hol" under a holiday.
 */
export function Calendar({ value, onChange, style }) {
  const today = todayET();
  const [cursor, setCursor] = useState(() => {
    const [year, month] = today.split('-').map(Number);
    return { year, month: month - 1 };
  });

  const cells = monthMatrix(cursor.year, cursor.month);
  const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(
    new Date(cursor.year, cursor.month, 1),
  );

  const step = delta =>
    setCursor(current => {
      const month = current.month + delta;
      if (month < 0) return { year: current.year - 1, month: 11 };
      if (month > 11) return { year: current.year + 1, month: 0 };
      return { year: current.year, month };
    });

  return (
    <View style={[styles.card, style]}>
      <View style={styles.monthRow}>
        <Pressable accessibilityRole="button" onPress={() => step(-1)} style={styles.monthBtn}>
          <Text style={styles.monthBtnText}>Prev</Text>
        </Pressable>
        <Text style={TEXT.button}>{monthLabel}</Text>
        <Pressable accessibilityRole="button" onPress={() => step(1)} style={styles.monthBtn}>
          <Text style={styles.monthBtnText}>Next</Text>
        </Pressable>
      </View>

      <View style={styles.grid}>
        {DAY_NAMES.map(day => (
          <View key={day} style={styles.cell}>
            <Text style={[styles.dayName, day === 'Sun' && styles.sunday]}>{day}</Text>
            {day === 'Sun' ? <Text style={styles.closed}>Closed</Text> : null}
          </View>
        ))}
        {cells.map((date, index) => {
          if (!date) return <View key={`e-${index}`} style={styles.cell} />;
          const selected = value === date;
          return (
            <Pressable
              key={date}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onChange(date)}
              style={[styles.cell, styles.dayCell, selected ? styles.dayOn : styles.dayOff]}>
              <Text style={[styles.dayNum, selected && styles.dayNumOn, isSunday(date) && !selected && styles.sunday]}>
                {Number(date.slice(-2))}
              </Text>
              {isHoliday(date) ? <Text style={[styles.hol, selected && styles.dayNumOn]}>Hol</Text> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** The two notes the web prints under the grid, kept together with it. */
export function CalendarNotes({ date }) {
  if (!date) return null;
  const holiday = isHoliday(date);
  return (
    <>
      {holiday ? (
        <Text style={styles.holidayNote}>
          {business.holidayNames[date]} is a holiday. A holiday surcharge may apply.
        </Text>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: RADIUS.lg, backgroundColor: c.card, padding: hSize(12) },
  monthRow: {
    marginBottom: vSize(8),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthBtn: { height: vSize(44), justifyContent: 'center', paddingHorizontal: hSize(8) },
  monthBtnText: { ...TEXT.label, fontFamily: TEXT.chip.fontFamily, color: c.primary },

  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  /** Seven columns with a 1pt gutter, the web's `grid-cols-7 gap-1`. */
  cell: { width: `${100 / 7}%`, alignItems: 'center', justifyContent: 'center', padding: 1 },
  dayCell: { height: vSize(44), borderRadius: 10 },
  dayOn: { backgroundColor: c.primary },
  dayOff: { backgroundColor: c.surface },
  dayName: { ...TEXT.caption, textAlign: 'center' },
  closed: { fontFamily: TEXT.caption.fontFamily, fontSize: fS(10), color: c.brand },
  sunday: { color: c.brand },
  dayNum: { ...TEXT.body },
  dayNumOn: { color: c.overlayText },
  hol: { fontFamily: TEXT.caption.fontFamily, fontSize: fS(9), color: c.warningText },

  holidayNote: { ...TEXT.caption, color: c.warningText },
});

export default Calendar;
