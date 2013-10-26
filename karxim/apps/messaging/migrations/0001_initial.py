# -*- coding: utf-8 -*-
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding model 'BannedSession'
        db.create_table(u'messaging_bannedsession', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('user', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['auth.User'], null=True, blank=True)),
            ('sessionid', self.gf('django.db.models.fields.CharField')(max_length=100, db_index=True)),
            ('created', self.gf('django.db.models.fields.DateTimeField')(auto_now_add=True, blank=True)),
        ))
        db.send_create_signal(u'messaging', ['BannedSession'])

        # Adding model 'Admin'
        db.create_table(u'messaging_admin', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('user', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['auth.User'], null=True, blank=True)),
            ('sessionid', self.gf('django.db.models.fields.CharField')(max_length=100, db_index=True)),
            ('created', self.gf('django.db.models.fields.DateTimeField')(auto_now_add=True, blank=True)),
        ))
        db.send_create_signal(u'messaging', ['Admin'])

        # Adding model 'Discussion'
        db.create_table(u'messaging_discussion', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('user', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['auth.User'], null=True, blank=True)),
            ('sessionid', self.gf('django.db.models.fields.CharField')(max_length=100, db_index=True)),
            ('title', self.gf('django.db.models.fields.CharField')(max_length=500)),
            ('admin', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('lastActive', self.gf('django.db.models.fields.DateTimeField')(auto_now_add=True, db_index=True, blank=True)),
            ('created', self.gf('django.db.models.fields.DateTimeField')(auto_now_add=True, db_index=True, blank=True)),
            ('usersPosted', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('totalMessages', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('lat', self.gf('django.db.models.fields.CharField')(max_length=50)),
            ('lng', self.gf('django.db.models.fields.CharField')(max_length=50)),
            ('distance', self.gf('django.db.models.fields.FloatField')(default=0)),
            ('newMessages', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('description', self.gf('django.db.models.fields.TextField')(max_length=10000)),
            ('explicit', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('index', self.gf('django.db.models.fields.CharField')(default='0', max_length=18, db_index=True)),
            ('password', self.gf('django.db.models.fields.CharField')(default='', max_length=100)),
            ('private', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('date', self.gf('django.db.models.fields.DateTimeField')(auto_now_add=True, blank=True)),
            ('upVote', self.gf('django.db.models.fields.IntegerField')(default=0, db_index=True)),
            ('downVote', self.gf('django.db.models.fields.IntegerField')(default=0)),
        ))
        db.send_create_signal(u'messaging', ['Discussion'])

        # Adding M2M table for field bannedsessions on 'Discussion'
        m2m_table_name = db.shorten_name(u'messaging_discussion_bannedsessions')
        db.create_table(m2m_table_name, (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('discussion', models.ForeignKey(orm[u'messaging.discussion'], null=False)),
            ('bannedsession', models.ForeignKey(orm[u'messaging.bannedsession'], null=False))
        ))
        db.create_unique(m2m_table_name, ['discussion_id', 'bannedsession_id'])

        # Adding M2M table for field admins on 'Discussion'
        m2m_table_name = db.shorten_name(u'messaging_discussion_admins')
        db.create_table(m2m_table_name, (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('discussion', models.ForeignKey(orm[u'messaging.discussion'], null=False)),
            ('admin', models.ForeignKey(orm[u'messaging.admin'], null=False))
        ))
        db.create_unique(m2m_table_name, ['discussion_id', 'admin_id'])

        # Adding model 'Message'
        db.create_table(u'messaging_message', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('user', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['auth.User'], null=True, blank=True)),
            ('sessionid', self.gf('django.db.models.fields.CharField')(max_length=100, db_index=True)),
            ('parent', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['messaging.Message'], null=True, blank=True)),
            ('discussion', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['messaging.Discussion'], null=True, blank=True)),
            ('stem', self.gf('django.db.models.fields.IntegerField')(default=0, db_index=True)),
            ('replies', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('newReplies', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('text', self.gf('django.db.models.fields.CharField')(max_length=1000)),
            ('username', self.gf('django.db.models.fields.CharField')(max_length=50)),
            ('distance', self.gf('django.db.models.fields.FloatField')(default=0)),
            ('lastActive', self.gf('django.db.models.fields.DateTimeField')(default=datetime.datetime(2013, 10, 26, 0, 0), auto_now_add=True, db_index=True, blank=True)),
            ('created', self.gf('django.db.models.fields.DateTimeField')(auto_now_add=True, db_index=True, blank=True)),
            ('image', self.gf('django.db.models.fields.files.ImageField')(max_length=100, null=True, blank=True)),
            ('caption', self.gf('django.db.models.fields.CharField')(default='', max_length=250)),
        ))
        db.send_create_signal(u'messaging', ['Message'])


    def backwards(self, orm):
        # Deleting model 'BannedSession'
        db.delete_table(u'messaging_bannedsession')

        # Deleting model 'Admin'
        db.delete_table(u'messaging_admin')

        # Deleting model 'Discussion'
        db.delete_table(u'messaging_discussion')

        # Removing M2M table for field bannedsessions on 'Discussion'
        db.delete_table(db.shorten_name(u'messaging_discussion_bannedsessions'))

        # Removing M2M table for field admins on 'Discussion'
        db.delete_table(db.shorten_name(u'messaging_discussion_admins'))

        # Deleting model 'Message'
        db.delete_table(u'messaging_message')


    models = {
        u'auth.group': {
            'Meta': {'object_name': 'Group'},
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '80'}),
            'permissions': ('django.db.models.fields.related.ManyToManyField', [], {'to': u"orm['auth.Permission']", 'symmetrical': 'False', 'blank': 'True'})
        },
        u'auth.permission': {
            'Meta': {'ordering': "(u'content_type__app_label', u'content_type__model', u'codename')", 'unique_together': "((u'content_type', u'codename'),)", 'object_name': 'Permission'},
            'codename': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'content_type': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['contenttypes.ContentType']"}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '50'})
        },
        u'auth.user': {
            'Meta': {'object_name': 'User'},
            'date_joined': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'email': ('django.db.models.fields.EmailField', [], {'max_length': '75', 'blank': 'True'}),
            'first_name': ('django.db.models.fields.CharField', [], {'max_length': '30', 'blank': 'True'}),
            'groups': ('django.db.models.fields.related.ManyToManyField', [], {'to': u"orm['auth.Group']", 'symmetrical': 'False', 'blank': 'True'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'is_active': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            'is_staff': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'is_superuser': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'last_login': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'last_name': ('django.db.models.fields.CharField', [], {'max_length': '30', 'blank': 'True'}),
            'password': ('django.db.models.fields.CharField', [], {'max_length': '128'}),
            'user_permissions': ('django.db.models.fields.related.ManyToManyField', [], {'to': u"orm['auth.Permission']", 'symmetrical': 'False', 'blank': 'True'}),
            'username': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '30'})
        },
        u'contenttypes.contenttype': {
            'Meta': {'ordering': "('name',)", 'unique_together': "(('app_label', 'model'),)", 'object_name': 'ContentType', 'db_table': "'django_content_type'"},
            'app_label': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'model': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '100'})
        },
        u'messaging.admin': {
            'Meta': {'object_name': 'Admin'},
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'sessionid': ('django.db.models.fields.CharField', [], {'max_length': '100', 'db_index': 'True'}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['auth.User']", 'null': 'True', 'blank': 'True'})
        },
        u'messaging.bannedsession': {
            'Meta': {'object_name': 'BannedSession'},
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'sessionid': ('django.db.models.fields.CharField', [], {'max_length': '100', 'db_index': 'True'}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['auth.User']", 'null': 'True', 'blank': 'True'})
        },
        u'messaging.discussion': {
            'Meta': {'object_name': 'Discussion'},
            'admin': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'admins': ('django.db.models.fields.related.ManyToManyField', [], {'to': u"orm['messaging.Admin']", 'symmetrical': 'False'}),
            'bannedsessions': ('django.db.models.fields.related.ManyToManyField', [], {'to': u"orm['messaging.BannedSession']", 'symmetrical': 'False'}),
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'db_index': 'True', 'blank': 'True'}),
            'date': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'description': ('django.db.models.fields.TextField', [], {'max_length': '10000'}),
            'distance': ('django.db.models.fields.FloatField', [], {'default': '0'}),
            'downVote': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'explicit': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'index': ('django.db.models.fields.CharField', [], {'default': "'0'", 'max_length': '18', 'db_index': 'True'}),
            'lastActive': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'db_index': 'True', 'blank': 'True'}),
            'lat': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'lng': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'newMessages': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'password': ('django.db.models.fields.CharField', [], {'default': "''", 'max_length': '100'}),
            'private': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'sessionid': ('django.db.models.fields.CharField', [], {'max_length': '100', 'db_index': 'True'}),
            'title': ('django.db.models.fields.CharField', [], {'max_length': '500'}),
            'totalMessages': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'upVote': ('django.db.models.fields.IntegerField', [], {'default': '0', 'db_index': 'True'}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['auth.User']", 'null': 'True', 'blank': 'True'}),
            'usersPosted': ('django.db.models.fields.IntegerField', [], {'default': '0'})
        },
        u'messaging.message': {
            'Meta': {'object_name': 'Message'},
            'caption': ('django.db.models.fields.CharField', [], {'default': "''", 'max_length': '250'}),
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'db_index': 'True', 'blank': 'True'}),
            'discussion': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['messaging.Discussion']", 'null': 'True', 'blank': 'True'}),
            'distance': ('django.db.models.fields.FloatField', [], {'default': '0'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'image': ('django.db.models.fields.files.ImageField', [], {'max_length': '100', 'null': 'True', 'blank': 'True'}),
            'lastActive': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime(2013, 10, 26, 0, 0)', 'auto_now_add': 'True', 'db_index': 'True', 'blank': 'True'}),
            'newReplies': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'parent': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['messaging.Message']", 'null': 'True', 'blank': 'True'}),
            'replies': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'sessionid': ('django.db.models.fields.CharField', [], {'max_length': '100', 'db_index': 'True'}),
            'stem': ('django.db.models.fields.IntegerField', [], {'default': '0', 'db_index': 'True'}),
            'text': ('django.db.models.fields.CharField', [], {'max_length': '1000'}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['auth.User']", 'null': 'True', 'blank': 'True'}),
            'username': ('django.db.models.fields.CharField', [], {'max_length': '50'})
        }
    }

    complete_apps = ['messaging']