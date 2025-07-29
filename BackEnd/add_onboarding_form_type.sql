-- Add onboarding form type to the database
INSERT INTO form_types (
    form_code, form_name, workflow_stage, description,
    requires_supervisor_approval, requires_admin_approval, requires_gec_approval
) VALUES (
    'ONBOARDING-001',
    'Initial Onboarding Form',
    'supervision_consent',
    'Initial student onboarding form with research proposal and preferences',
    true,
    false,
    false
) ON CONFLICT (form_code) DO UPDATE SET
    form_name = EXCLUDED.form_name,
    workflow_stage = EXCLUDED.workflow_stage,
    description = EXCLUDED.description,
    requires_supervisor_approval = EXCLUDED.requires_supervisor_approval,
    requires_admin_approval = EXCLUDED.requires_admin_approval,
    requires_gec_approval = EXCLUDED.requires_gec_approval; 