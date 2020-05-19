from django.db import models
from django.dispatch import receiver

from poll_service.tasks import create_poll_context
from main_function.sessions_storage import logout_user
from django.contrib import admin


# Create your models here.

class Poll(models.Model):
    guid = models.CharField(primary_key=True, max_length=36)
    description = models.CharField(max_length=62)
    date_start = models.DateTimeField()
    active = models.BooleanField(default=True)
    first_node = models.OneToOneField('manage_service.NodeQuestions', on_delete=models.CASCADE)


@receiver(models.signals.post_save, sender=Poll, dispatch_uid='Poll_edit')
def poll_edit(sender, instance, using, **kwargs):
    create_poll_context(instance.guid)


@receiver(models.signals.post_init, sender=Poll, dispatch_uid='Poll_init')
def poll_init(sender, instance, using, **kwargs):
    create_poll_context(instance.guid)


class UserGuid(models.Model):
    guid = models.CharField(primary_key=True, max_length=36)
    poll = models.ForeignKey('manage_service.Poll', related_name="tokens_to_poll", on_delete=models.CASCADE,
                             db_index=True)


@receiver(models.signals.pre_delete, sender=UserGuid, dispatch_uid='token_delete_signal')
def delete_tokens_session(sender, instance, using, **kwargs):
    logout_user(instance.guid)


class PeopleAnswer(models.Model):
    token = models.ForeignKey('manage_service.UserGuid', related_name="people_answer_to_tokens", db_index=True,
                              on_delete=models.CASCADE)
    question = models.ForeignKey('manage_service.Question', related_name="people_answer_to_questions", db_index=True,
                                 on_delete=models.CASCADE)
    data = models.TextField(null=True)

    answer = models.ForeignKey('manage_service.AnswersOption', related_name="people_answer_to_answer", null=True,
                               on_delete=models.CASCADE)


@admin.register(PeopleAnswer)
class PeopleAnswerAdmin(admin.ModelAdmin):
    list_display = ("token", "question", "data")
    list_filter = ("token", "question")


class NodeQuestions(models.Model):
    guid = models.CharField(primary_key=True, max_length=36)
    question = models.ForeignKey('manage_service.Question', related_name="node_to_questions", db_index=True,
                                 on_delete=models.CASCADE)
    next_node = models.OneToOneField('manage_service.NodeQuestions', on_delete=models.CASCADE,
                                     related_name="NodeQuestions_next")
    prev_node = models.OneToOneField('manage_service.NodeQuestions', on_delete=models.CASCADE,
                                     related_name="NodeQuestions_prev")
    duration = models.IntegerField()


class Question(models.Model):
    def __str__(self):
        return self.title

    guid = models.CharField(primary_key=True, max_length=36)
    index = models.IntegerField(db_index=True)
    title = models.CharField(max_length=62)
    type = models.CharField(max_length=62)
    text = models.CharField(max_length=128)
    first_poll_problem_block = models.OneToOneField('manage_service.PollProblemBlock', on_delete=models.CASCADE)


class PollProblemBlock(models.Model):
    type = models.CharField(max_length=36)
    text = models.TextField()
    questions = models.ForeignKey('manage_service.Question', related_name="PollProblemBlock_to_questions",
                                  on_delete=models.CASCADE,
                                  db_index=True)
    next_poll = models.OneToOneField('manage_service.PollProblemBlock', on_delete=models.CASCADE,
                                     related_name="PollProblem_next")
    prev_poll = models.OneToOneField('manage_service.PollProblemBlock', on_delete=models.CASCADE,
                                     related_name="PollProblem_prev")


class AnswersOption(models.Model):
    guid = models.CharField(primary_key=True, max_length=36)
    question = models.ForeignKey('manage_service.Question', related_name="answer_options_to_questions",
                                 on_delete=models.CASCADE,
                                 db_index=True)
    label = models.TextField()
