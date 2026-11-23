import { describe, expect, it } from 'vitest';
import { courseRegistrationFromSurvey, studentFromSurvey } from '../../src/repositories/surveyMapping';

describe('survey mapping', () => {
  it('reads the registration answers into a student record', () => {
    expect(
      studentFromSurvey({
        first_name: ' Ada ',
        last_name: 'Lopez',
        date_of_birth: '2004-03-03',
        student_number: 'STU-2001',
        programme_id: 'prog-cs',
        department_id: 'dept-cs',
        email: 'ada.lopez@acme.edu',
      }),
    ).toMatchObject({
      firstName: 'Ada',
      lastName: 'Lopez',
      studentNumber: 'STU-2001',
      programmeId: 'prog-cs',
    });
  });

  it('treats the prerequisite checkbox as confirmed only when it is checked', () => {
    expect(courseRegistrationFromSurvey({ prerequisite_confirmation: true }).prerequisiteConfirmation).toBe(true);
    expect(courseRegistrationFromSurvey({ prerequisite_confirmation: false }).prerequisiteConfirmation).toBe(false);
  });
});
