
export function getThreeMonthsAgoDate(): Date {
    const date = new Date();
    date.setMonth(date.getMonth() - 3);
    return date;
}

export function getLastMonthRange(): { start: Date; end: Date } {
    const date = new Date();
    // Set to first day of current month
    date.setDate(1);
    // Move back one month
    date.setMonth(date.getMonth() - 1);

    const start = new Date(date);
    start.setHours(0, 0, 0, 0);

    const end = new Date(date);
    // Move to end of that month
    end.setMonth(end.getMonth() + 1);
    end.setDate(0);
    end.setHours(23, 59, 59, 999);

    return { start, end };
}
