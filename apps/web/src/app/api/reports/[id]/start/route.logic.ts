type ScheduledStartInput = {
  hasLinkedGa4: boolean;
  forceWithoutGa4: boolean;
};

export function shouldAllowScheduledStart(input: ScheduledStartInput) {
  return input.hasLinkedGa4 || input.forceWithoutGa4;
}
