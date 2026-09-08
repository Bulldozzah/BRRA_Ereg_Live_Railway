// =============================================================================
// TypeScript interfaces mapping 1:1 to the `zambiaeregistry` MySQL database.
// Table names, column names, and types are preserved exactly.
// =============================================================================

// ---------------------------------------------------------------------------
// Shared audit columns (present on most tables)
// ---------------------------------------------------------------------------
export interface AuditFields {
  created_by: number | null;
  updated_by: number | null;
  content_changed_by: number | null;
  created: string;   // datetime
  updated: string;   // datetime
  content_changed: string | null;
}

// ---------------------------------------------------------------------------
// Business License Core
// ---------------------------------------------------------------------------
export interface BusinessLicense extends AuditFields {
  id: number;
  location_id: number | null;
  agency_id: number | null;
  name: string;
  keywords: string | null;
  purpose: string | null;
  description: string | null;
  comments: string | null;
  license_no: string | null;
  application_fee: string | null;
  license_fee: string | null;
  max_processing_time: string | null;
  gazetted_on: string | null;
  related_websites: string | null;
  validity: string | null;
  enactment: string | null;
  gazetting_ref: string | null;
  contact_office: string | null;
  resolution_criteria: string | null;
  status: string | null;
  deleted: boolean;
  universal: boolean | null;
  views: number | null;
  stage_id: number;
  slug: string | null;
  subsidiary_legislation: string | null;
  principle_legislation: string | null;
  principle_legislation_attachment: string | null;
  requirements: string | null;
}

export interface LicenseRequirement extends AuditFields {
  id: number;
  license_id: number;
  description: string;
}

export interface LicenseStatute extends AuditFields {
  id: number;
  license_id: number;
  name: string;
  issued_on: string | null;
  issued_by: string | null;
  statute_no: string | null;
  valid_from: string | null;
  valid_to: string | null;
  deleted: boolean;
  chapter: string | null;
  section: string | null;
}

export interface LicenseDownload extends AuditFields {
  id: number;
  license_id: number;
  name: string | null;
  filepath: string | null;
  type_id: number;
  filesize: number;
  issuing_body: string | null;
}

// ---------------------------------------------------------------------------
// License Dynamic Fields
// ---------------------------------------------------------------------------
export interface LicenseField extends AuditFields {
  id: number;
  fieldlabel: string;
  fieldtype: number;
  fieldoptions: string;
  fieldorder: number;
  showed: boolean;
}

export interface LicenseFieldChoice extends AuditFields {
  id: number;
  license_id: number | null;
  choicename: string;
  choiceorder: number;
  showed: boolean;
  field_id: number;
}

export interface LicenseFieldData extends AuditFields {
  id: number;
  license_id: number;
  fielddata: string | null;
  field_id: number;
}

export interface LicenseFixedField {
  id: number;
  fieldid: number;
  fieldlabel: string;
  showed: boolean | null;
  required: boolean | null;
}

// ---------------------------------------------------------------------------
// Business Agency
// ---------------------------------------------------------------------------
export interface BusinessAgency extends AuditFields {
  id: number;
  location_id: number;
  title: string;
  name: string;
  fax: string | null;
  address: string | null;
  telephone: string | null;
  email: string | null;
  website: string | null;
  hours: string | null;
  postal_address: string | null;
  latitude: number | null;
  longitude: number | null;
  map_scan: string | null;
  business_no: string | null;
  deleted: boolean;
  slug: string | null;
  acronym: string | null;
}

export interface BusinessAgencyOffice extends AuditFields {
  id: number;
  location_id: number;
  agency_id: number;
  name: string | null;
  fax: string | null;
  address: string | null;
  telephone: string | null;
  email: string | null;
  website: string | null;
  hours: string | null;
  is_main_location: boolean;
  postal_address: string | null;
  latitude: number | null;
  longitude: number | null;
  map_scan: string | null;
  deleted: boolean;
}

// ---------------------------------------------------------------------------
// Business Activity
// ---------------------------------------------------------------------------
export interface BusinessActivity extends AuditFields {
  id: number;
  name: string;
  description: string;
  deleted: boolean;
}

// ---------------------------------------------------------------------------
// Business Industry
// ---------------------------------------------------------------------------
export interface BusinessIndustry extends AuditFields {
  id: number;
  name: string;
  description: string;
  deleted: boolean;
  show_in_browse: boolean;
}

// ---------------------------------------------------------------------------
// Business Type
// ---------------------------------------------------------------------------
export interface BusinessType extends AuditFields {
  id: number;
  name: string;
  description: string;
  deleted: boolean;
  show_in_browse: boolean;
}

// ---------------------------------------------------------------------------
// Business Location
// ---------------------------------------------------------------------------
export interface BusinessLocation extends AuditFields {
  id: number;
  name: string;
  is_default: boolean;
  deleted: boolean;
  parent: number | null;
}

export interface BusinessLocationCategory {
  id: number;
  name: string;
  published: boolean;
}

// ---------------------------------------------------------------------------
// Business Startup / Procedures
// ---------------------------------------------------------------------------
export interface BusinessStartup {
  id: number;
  name: string;
  description: string;
  is_published: boolean;
  links: string | null;
  deleted: boolean;
  procedure_category_id: number;
  slug: string | null;
}

export interface ProcedureCategory {
  id: number;
  title: string;
  publish: boolean;
  deleted: boolean;
}

// ---------------------------------------------------------------------------
// Join Tables (M2M relationships)
// ---------------------------------------------------------------------------
export interface LicensesActivities {
  businessactivity_id: number;
  businesslicense_id: number;
}

export interface BusinessTypesActivities {
  businessactivity_id: number;
  businesstype_id: number;
}

export interface BusinessTypesIndustries {
  businesstype_id: number;
  businessindustry_id: number;
}

export interface BusinessAgencyIndustries {
  businessagency_id: number;
  businessindustry_id: number;
}

// ---------------------------------------------------------------------------
// Regulations
// ---------------------------------------------------------------------------
export interface Regulation {
  id: number;
  title: string;
  description: string | null;
  documents: string | null;
  publish_date: string | null;
  closing_date: string | null;
  agency_id: number;
  industry_id: number;
  tags: string | null;
  keywords: string | null;
  specific_instructions: string | null;
  supporting_materials: string | null;
  is_public: boolean;
  is_login_required: boolean;
  consultation_stage: number;
  deleted: boolean;
  main_highlight: boolean;
  regulation_type: number;
  checking_closed: number;
  published: boolean;
  slug: string | null;
  supporting_materials_id: number | null;
  review_comments: boolean;
  enable_attachments: boolean;
  offline_consultations: string | null;
  position: number;
  file_size: number | null;
  file_type: string | null;
  expected_outcome: string | null;
  document_size: number | null;
}

export interface RegulationAttachment extends AuditFields {
  id: number;
  regulation_id: number;
  filepath: string | null;
  filesize: number;
  name: string | null;
}

export interface RegulationBanner {
  id: number;
  title: string;
  description: string | null;
  image: string;
  deleted: boolean;
  created: string;
  updated: string;
  content_changed: string | null;
}

// ---------------------------------------------------------------------------
// Regulation Dynamic Fields
// ---------------------------------------------------------------------------
export interface RegulationField extends AuditFields {
  id: number;
  fieldlabel: string;
  fieldtype: number;
  fieldoptions: string;
  fieldorder: number;
  showed: boolean;
}

export interface RegulationFieldChoice extends AuditFields {
  id: number;
  license_id: number | null;
  choicename: string;
  choiceorder: number;
  showed: boolean;
  field_id: number;
}

export interface RegulationFieldData extends AuditFields {
  id: number;
  regulation_id: number;
  fielddata: string | null;
  field_id: number;
}

export interface RegulationFixedField {
  id: number;
  fieldid: number;
  fieldlabel: string;
  showed: boolean | null;
  required: boolean | null;
}

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------
export interface Comment {
  id: number;
  comment: string;
  regulation_id: number;
  created_at: string;
  updated_at: string;
  likes: number | null;
  parent: number | null;
  status: number | null;
  user: number;
  is_abusive: boolean | null;
  deleted_at: string | null;
  position: number;
  documents: string | null;
  new_comment: string | null;
  is_admin: boolean;
  check_abusive: boolean;
  publish: boolean;
  hidden: boolean;
  deleted: boolean;
  pending_review: boolean;
  upvote_count: number;
  parent_right: number | null;
}

export interface CommentAlertSent {
  id: number;
  comment_id: number;
  is_sent: boolean;
}

export interface Like {
  id: number;
  comment_id: number;
  regulation_id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  user: number;
}

export interface Position {
  id: number;
  position: string | null;
  regulation_id: number | null;
}

export interface AbusiveTerm {
  id: number;
  terms: string | null;
}

// ---------------------------------------------------------------------------
// News
// ---------------------------------------------------------------------------
export interface News extends AuditFields {
  id: number;
  title: string;
  article: string;
  hits: number;
  published: boolean;
  deleted: boolean;
}

// ---------------------------------------------------------------------------
// Newsletter
// ---------------------------------------------------------------------------
export interface Newsletter extends AuditFields {
  id: number;
  subject: string;
  content: string;
  sent: boolean;
  deleted: boolean;
}

export interface NewsletterSubscriber extends AuditFields {
  id: number;
  name: string;
  email: string;
  organisation: string;
  skey: string;
  confirmed: boolean;
}

// ---------------------------------------------------------------------------
// FAQ
// ---------------------------------------------------------------------------
export interface FAQ extends AuditFields {
  id: number;
  question: string;
  answer: string;
  name: string | null;
  organization: string | null;
  email: string;
  published: boolean;
  deleted: boolean;
  site: number;
  order_level: number;
}

// ---------------------------------------------------------------------------
// Feedback
// ---------------------------------------------------------------------------
export interface Feedback extends AuditFields {
  id: number;
  subject: string;
  type: string;
  first_name: string;
  last_name: string;
  email: string;
  message: string;
  site: number;
  replied: boolean;
  reply_message: string | null;
}

// ---------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------
export interface Page extends AuditFields {
  id: number;
  menu_id: number | null;
  page_title: string;
  page_breadcrumb_title: string;
  page_content: string | null;
  seo_keywords: string | null;
  seo_description: string | null;
  page_layout: number;
  page_order: number;
  published: boolean | null;
  deleted: boolean;
  url: string | null;
  parent_id: number | null;
  site: number;
  slug: string | null;
}

export interface Menu extends AuditFields {
  id: number;
  title: string;
  published: boolean;
  deleted: boolean;
}

// ---------------------------------------------------------------------------
// Banners
// ---------------------------------------------------------------------------
export interface Banner {
  id: number;
  title: string;
  description: string;
  image: string;
  deleted: boolean;
  created: string;
  updated: string;
  content_changed: string | null;
}

// ---------------------------------------------------------------------------
// Policies
// ---------------------------------------------------------------------------
export interface Policy {
  id: number;
  created_by: number | null;
  updated_by: number | null;
  content_changed_by: number | null;
  title: string;
  content: string | null;
  seo_keywords: string | null;
  seo_description: string | null;
  published: boolean | null;
  deleted: boolean;
  created: string;
  updated: string;
  policy_type_id: number;
  site: string;
  slug: string | null;
}

export interface PolicyType {
  id: number;
  created_by: number | null;
  updated_by: number | null;
  content_changed_by: number | null;
  title: string;
  created: string;
  updated: string;
}

// ---------------------------------------------------------------------------
// Forward Plans
// ---------------------------------------------------------------------------
export interface ForwardPlan {
  id: number;
  title: string;
  description: string | null;
  problem_addressed: string | null;
  public_consultation: string | null;
  attachment_id: number | null;
  agency_id: number | null;
  offline_office: string | null;
  impact: string | null;
  period: string | null;
  related_links: string | null;
  slug: string | null;
  published: boolean;
  deleted: boolean;
  forward_plan_category_id: number | null;
  created_by: number | null;
}

export interface ForwardPlanAttachment extends AuditFields {
  id: number;
  forward_plan_id: number;
  filepath: string;
  filesize: number;
  name: string | null;
}

export interface ForwardPlanCategory {
  id: number;
  name: string;
  description: string | null;
  period: string;
  created_at: string | null;
  updated_at: string | null;
  period_2: string | null;
  slug: string | null;
  published: boolean;
  deleted: boolean;
  agency_id: number;
}

// ---------------------------------------------------------------------------
// Surveys / Questions
// ---------------------------------------------------------------------------
export interface Question {
  id: number;
  survey_id: number;
  question_type: string | null;
  question_text: string | null;
  is_required: number | null;
  question_order: number | null;
  choice_list: string | null;
}

export interface Choice {
  id: number;
  question_id: number;
  choice_text: string | null;
  choice_order: number | null;
}

// ---------------------------------------------------------------------------
// Users & Groups & Roles
// ---------------------------------------------------------------------------
export interface Group extends AuditFields {
  id: number;
  name: string;
  roles: string; // serialized array
}

export interface Role extends AuditFields {
  id: number;
  title: string;
  role_code: string;
}

// ---------------------------------------------------------------------------
// Subscriber Lists
// ---------------------------------------------------------------------------
export interface AgencySubscriberList {
  id: number;
  user_id: number | null;
  agency_id: number | null;
}

export interface IndustrySubscriberList {
  id: number;
  user_id: number | null;
  industry_id: number | null;
}

// ---------------------------------------------------------------------------
// Workflow
// ---------------------------------------------------------------------------
export interface LicenseWorkflow {
  id: number;
  title: string;
  send_emails: boolean;
  order_level: number | null;
  assignee_id: number | null;
  task_description: string | null;
  number_of_days: number | null;
  type: string;
  published: boolean;
  deleted: boolean;
  next_stage: number | null;
  reject_stage: number;
  stage_id: number | null;
  first_stage: boolean | null;
}

export interface LicenseWorkflowAgency {
  workflow_id: number;
  businessagency_id: number;
}

export interface LicenseWorkflowGroups {
  workflow_id: number;
  group_id: number;
}

export interface LicenseWorkflowUsers {
  workflow_id: number;
  user_id: number;
}

export interface ApplicationHistory {
  id: number;
  user_id: number;
  action_type: string;
  previous_stage: number | null;
  application_id: number | null;
  current_step: number | null;
}

// ---------------------------------------------------------------------------
// Messaging
// ---------------------------------------------------------------------------
export interface Thread {
  id: number;
  createdBy_id: number | null;
  subject: string;
  is_spam: boolean;
}

export interface ThreadMetadata {
  id: number;
  thread_id: number | null;
  participant_id: number | null;
  is_deleted: boolean;
  last_message_date: string | null;
  last_participant_message_date: string | null;
}

export interface Message {
  id: number;
  thread_id: number | null;
  sender_id: number | null;
  body: string;
  created_at: string;
}

export interface MessageMetadata {
  id: number;
  message_id: number | null;
  participant_id: number | null;
  is_read: boolean;
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------
export interface Notification {
  id: number;
  sender: number | null;
  recipient: number | null;
  message: string | null;
  reference: string | null;
  reference_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  is_read: boolean;
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------
export interface Search {
  id: number;
  name: string;
  userid: number;
}

export interface SearchContent {
  id: number;
  search_id: number | null;
  license_id: number | null;
}

// ---------------------------------------------------------------------------
// Audit / Translations / Locale
// ---------------------------------------------------------------------------
export interface ExtLogEntry {
  id: number;
  action: string;
  logged_at: string;
  object_id: string | null;
  object_class: string;
  version: number;
  data: string | null;
  username: string | null;
}

export interface ExtTranslation {
  id: number;
  locale: string;
  object_class: string;
  field: string;
  foreign_key: string;
  content: string | null;
}

export interface Locale {
  id: number;
  title: string;
  locale_code: string;
  enabled: boolean | null;
  is_default: boolean | null;
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------
export interface Session {
  id: string;
  access: string;
  data: string;
}

// ---------------------------------------------------------------------------
// API response wrappers
// ---------------------------------------------------------------------------
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}
