import { registerActionProviderTests } from './contracts/action-provider.test.mjs';
import { registerCarrierTests } from './contracts/carrier.test.mjs';
import { registerExecutionAbsenceTests } from './contracts/execution-absence.test.mjs';
import { registerPrinciplesEpistemicTests } from './contracts/principles-epistemic.test.mjs';
import { registerStageSurfaceTests } from './contracts/stage-surfaces.test.mjs';

registerActionProviderTests();
registerPrinciplesEpistemicTests();
registerStageSurfaceTests();
registerCarrierTests();
registerExecutionAbsenceTests();
