import React from 'react';
import { Link } from 'react-router-dom';
import { Student } from '../../types/campus';
import { fullName } from '../../ui/format';
import { panelClass, Pill } from '../../ui/components';

export const StudentCard: React.FC<{ student: Student }> = ({ student }) => (
  <article className={`${panelClass} px-5 py-5 md:px-6`}>
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <Link to={`/students/${student.id}`} className="text-base font-semibold text-primary hover:text-primary-hover sm:text-lg">
          {fullName(student.firstName, student.lastName)}
        </Link>
        <p className="mt-1 text-sm text-muted-foreground">
          {student.studentNumber} · {student.programmeName}
        </p>
        <p className="mt-1 text-xs text-subtle-foreground">
          {student.departmentName} · {student.academicYear}
        </p>
      </div>
      <Pill>{student.status}</Pill>
    </div>
  </article>
);
